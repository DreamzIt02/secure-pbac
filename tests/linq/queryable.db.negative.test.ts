import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseQueryable, IQueryProvider, QueryExpression } from "../../src/linq/index.js";

// Fake provider that can simulate different result sets
class FakeProvider implements IQueryProvider {
  public lastExpr: QueryExpression | null = null;
  public result: any = null;

  createQuery<T>(expression: QueryExpression): DatabaseQueryable<T> {
    this.lastExpr = expression;
    return new DatabaseQueryable<T>(this, expression);
  }

  execute<T>(expression: QueryExpression): T {
    this.lastExpr = expression;
    return this.result as T;
  }
}

describe("DatabaseQueryable negative cases", () => {
  let provider: FakeProvider;
  let rootExpr: QueryExpression;
  let query: DatabaseQueryable<number>;

  beforeEach(() => {
    provider = new FakeProvider();
    rootExpr = { type: "Root", args: [] };
    query = new DatabaseQueryable<number>(provider, rootExpr);
  });

  it("single throws when multiple results", () => {
    // Simulate provider returning multiple results
    provider.execute = () => {
      throw new Error("Sequence does not contain exactly one element");
    };
    expect(() => query.single()).toThrow("Sequence does not contain exactly one element");
  });

  it("singleOrDefault throws when multiple results", () => {
    provider.execute = () => {
      throw new Error("Sequence contains more than one element");
    };
    expect(() => query.singleOrDefault()).toThrow("Sequence contains more than one element");
  });

  it("first returns null when no results", () => {
    provider.result = null;
    expect(query.first()).toBeNull();
  });

  it("firstOrDefault returns null when no results", () => {
    provider.result = null;
    expect(query.firstOrDefault()).toBeNull();
  });

  it("any returns false when no results", () => {
    provider.result = false;
    expect(query.any()).toBe(false);
  });

  it("all returns true when empty sequence", () => {
    provider.result = true;
    expect(query.all(() => true)).toBe(true);
  });
});
