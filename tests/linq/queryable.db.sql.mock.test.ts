import { describe, it, expect } from "vitest";
import { QueryExpression, SqlQueryProvider } from "../../src/linq/index.js";

// Fake connection that records SQL and returns canned results
class FakeConnection {
  public lastSql: string | null = null;
  public result: any = null;

  query(sql: string) {
    this.lastSql = sql;
    return this.result;
  }
}

// Concrete provider that uses FakeConnection
class TestSqlProvider extends SqlQueryProvider {
  protected translatePredicate(predicate: Function): string {
    return "Predicate";
  }
  protected translateSelector(selector: Function): string {
    return "Selector";
  }
  protected translateKeySelector(selector: Function): string {
    return "KeySelector";
  }
  protected translateJoin(expression: QueryExpression, sourceSql: string): string {
    return `${sourceSql} JOIN Inner ON OuterKey=InnerKey`;
  }
  protected translateAll(predicate: Function, sourceSql: string): string {
    return `${sourceSql} ALL Predicate`;
  }

  // Override execute to use fake connection
  execute<T>(expression: QueryExpression): T {
    const sql = (this as any).translateExpression(expression);
    return this.connection.query(sql) as T;
  }
}

describe("SqlQueryProvider with mocked connection", () => {
  it("executes translated SQL and returns results", () => {
    const fakeConn = new FakeConnection();
    fakeConn.result = [{ id: 1, name: "Alice" }];

    const provider = new TestSqlProvider(fakeConn);

    const expr: QueryExpression = { type: "Where", args: [() => true] };
    const result = provider.execute(expr);

    expect(fakeConn.lastSql).toContain("WHERE Predicate");
    expect(result).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("executes aggregation and returns scalar", () => {
    const fakeConn = new FakeConnection();
    fakeConn.result = 42;

    const provider = new TestSqlProvider(fakeConn);

    const expr: QueryExpression = { type: "Count", args: [] };
    const result = provider.execute<number>(expr);

    expect(fakeConn.lastSql).toContain("COUNT(*)");
    expect(result).toBe(42);
  });
});
