import { describe, it, expect, beforeEach } from "vitest";
import { QueryExpression, SqlQueryProvider } from "../../src/linq/index.js";

// Fake concrete provider with trivial translations
class FakeSqlProvider extends SqlQueryProvider {
  protected translatePredicate(predicate: Function): string { return "Predicate"; }
  protected translateSelector(selector: Function): string { return "Selector"; }
  protected translateKeySelector(selector: Function): string { return "KeySelector"; }
  protected translateJoin(expression: QueryExpression, sourceSql: string): string {
    return `${sourceSql} JOIN Inner ON OuterKey=InnerKey`;
  }
  protected translateAll(predicate: Function, sourceSql: string): string {
    return `${sourceSql} ALL Predicate`;
  }

  // Override execute to return the SQL string for testing
  execute<T>(expression: QueryExpression): T {
    return this.translateExpression(expression) as unknown as T;
  }
}


describe("SqlQueryProvider", () => {
  let provider: FakeSqlProvider;

  beforeEach(() => {
    provider = new FakeSqlProvider("fake-connection");
  });

  it("returns default SQL when expression is null", () => {
    const sql = (provider as any).translateExpression(null);
    expect(sql).toBe("SELECT * FROM Table");
  });

  it("translates Where", () => {
    const expr: QueryExpression = { type: "Where", args: [() => true] };
    const sql = provider.execute(expr);
    expect(sql).toContain("WHERE Predicate");
  });

  it("translates Select and SelectMany", () => {
    const expr: QueryExpression = { type: "Select", args: [() => 1] };
    expect(provider.execute(expr)).toContain("SELECT Selector");

    const expr2: QueryExpression = { type: "SelectMany", args: [() => [1]] };
    expect(provider.execute(expr2)).toContain("SELECT Selector");
  });

  it("translates Skip and Take", () => {
    expect(provider.execute({ type: "Skip", args: [5] })).toContain("OFFSET 5 ROWS");
    expect(provider.execute({ type: "Take", args: [10] })).toContain("LIMIT 10");
  });

  it("translates OrderBy and OrderByDescending", () => {
    expect(provider.execute({ type: "OrderBy", args: [() => 1] })).toContain("ORDER BY KeySelector ASC");
    expect(provider.execute({ type: "OrderByDescending", args: [() => 1] })).toContain("ORDER BY KeySelector DESC");
  });

  it("translates GroupBy", () => {
    expect(provider.execute({ type: "GroupBy", args: [() => 1] })).toContain("GROUP BY KeySelector");
  });

  it("translates Join", () => {
    expect(provider.execute({ type: "Join", args: [[], () => 1, () => 1, () => 1] })).toContain("JOIN Inner");
  });

  it("translates aggregations", () => {
    expect(provider.execute({ type: "Count", args: [] })).toContain("COUNT(*)");
    expect(provider.execute({ type: "Sum", args: [() => 1] })).toContain("SUM(Selector)");
    expect(provider.execute({ type: "Average", args: [() => 1] })).toContain("AVG(Selector)");
    expect(provider.execute({ type: "Min", args: [() => 1] })).toContain("MIN(Selector)");
    expect(provider.execute({ type: "Max", args: [() => 1] })).toContain("MAX(Selector)");
  });

  it("translates Any and All", () => {
    expect(provider.execute({ type: "Any", args: [] })).toContain("EXISTS");
    expect(provider.execute({ type: "All", args: [() => true] })).toContain("ALL Predicate");
  });

  it("translates element operators", () => {
    expect(provider.execute({ type: "First", args: [] })).toContain("LIMIT 1");
    expect(provider.execute({ type: "FirstOrDefault", args: [] })).toContain("LIMIT 1");
    expect(provider.execute({ type: "Single", args: [] })).toContain("LIMIT 2");
    expect(provider.execute({ type: "SingleOrDefault", args: [] })).toContain("LIMIT 2");
  });

  it("translates Find", () => {
    expect(provider.execute({ type: "Find", args: [() => true] })).toContain("WHERE Predicate");
  });

  it("falls back to sourceSql for unknown type", () => {
    const expr: QueryExpression = { type: "Unknown", args: [] };
    expect(provider.execute(expr)).toBe("SELECT * FROM Table");
  });
});
