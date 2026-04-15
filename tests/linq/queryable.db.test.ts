import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseQueryable, IQueryProvider, QueryExpression } from "../../src/linq/index.js";

// Fake provider that records the last expression and returns canned results
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

describe("DatabaseQueryable", () => {
  let provider: FakeProvider;
  const rootExpr: QueryExpression = { type: "Root", args: [] };
  let query: DatabaseQueryable<number>;

  beforeEach(() => {
    provider = new FakeProvider();
    query = new DatabaseQueryable<number>(provider, rootExpr);
  });

  it("iterates using provider.execute", () => {
    provider.result = [1, 2, 3];
    const arr = [...query];
    expect(arr).toEqual([1, 2, 3]);
    expect(provider.lastExpr?.type).toBe("Root");
  });

  it("builds where expression", () => {
    const q = query.where(x => x > 1);
    expect((q as any).expression.type).toBe("Where");
  });

  it("skip and take build expressions", () => {
    expect((query.skip(2) as any).expression.type).toBe("Skip");
    expect((query.take(2) as any).expression.type).toBe("Take");
  });

  it("select and selectMany build expressions", () => {
    expect((query.select(x => x * 2) as any).expression.type).toBe("Select");
    expect((query.selectMany(x => [x, x]) as any).expression.type).toBe("SelectMany");
  });

  it("orderBy and orderByDescending build expressions", () => {
    expect((query.orderBy(x => x) as any).expression.type).toBe("OrderBy");
    expect((query.orderByDescending(x => x) as any).expression.type).toBe("OrderByDescending");
  });

  it("groupBy builds expression", () => {
    expect((query.groupBy(x => x % 2) as any).expression.type).toBe("GroupBy");
  });

  it("join builds expression", () => {
    const inner = new DatabaseQueryable<number>(provider, rootExpr);
    const q = query.join(inner, x => x, y => y, (x, y) => x + y);
    expect((q as any).expression.type).toBe("Join");
  });

  it("aggregation methods call provider.execute", () => {
    provider.result = 5;
    expect(query.count()).toBe(5);
    expect(provider.lastExpr?.type).toBe("Count");

    provider.result = 10;
    expect(query.sum(x => x)).toBe(10);
    expect(provider.lastExpr?.type).toBe("Sum");

    provider.result = 2;
    expect(query.average(x => x)).toBe(2);
    expect(provider.lastExpr?.type).toBe("Average");

    provider.result = 1;
    expect(query.min(x => x)).toBe(1);
    expect(provider.lastExpr?.type).toBe("Min");

    provider.result = 9;
    expect(query.max(x => x)).toBe(9);
    expect(provider.lastExpr?.type).toBe("Max");
  });

  it("quantifiers call provider.execute", () => {
    provider.result = true;
    expect(query.any()).toBe(true);
    expect(provider.lastExpr?.type).toBe("Any");

    provider.result = false;
    expect(query.all(x => x > 0)).toBe(false);
    expect(provider.lastExpr?.type).toBe("All");
  });

  it("element operators call provider.execute", () => {
    provider.result = 1;
    expect(query.first()).toBe(1);
    expect(provider.lastExpr?.type).toBe("First");

    provider.result = null;
    expect(query.firstOrDefault()).toBeNull();
    expect(provider.lastExpr?.type).toBe("FirstOrDefault");

    provider.result = 42;
    expect(query.single()).toBe(42);
    expect(provider.lastExpr?.type).toBe("Single");

    provider.result = null;
    expect(query.singleOrDefault()).toBeNull();
    expect(provider.lastExpr?.type).toBe("SingleOrDefault");
  });

  it("find builds expression and calls provider", () => {
    provider.result = 7;
    expect(query.find(x => x === 7)).toBe(7);
    expect(provider.lastExpr?.type).toBe("Find");
  });

  it("toArray calls provider.execute", () => {
    provider.result = [1, 2];
    expect(query.toArray()).toEqual([1, 2]);
    expect(provider.lastExpr?.type).toBe("Root");
  });
});

// A fake provider that just returns predictable results
const fakeProvider1 = {
  execute: (expr: any) => {
    switch (expr.type) {
      case "Count": return expr.args.length === 0 ? 42 : 99;
      case "Any": return expr.args.length === 0 ? false : true;
      case "First": return expr.args.length === 0 ? "firstDefault" : "firstWithPredicate";
      case "FirstOrDefault": return expr.args.length === 0 ? null : "firstOrDefaultWithPredicate";
      case "Single": return expr.args.length === 0 ? "singleDefault" : "singleWithPredicate";
      case "SingleOrDefault": return expr.args.length === 0 ? null : "singleOrDefaultWithPredicate";
      default: return [];
    }
  }
};

describe("DatabaseQueryable branch coverage", () => {
  let provider: FakeProvider;
  const rootExpr: QueryExpression = { type: "Root", args: [] };
  let queryable: DatabaseQueryable<string>;

  beforeEach(() => {
    provider = new FakeProvider();
    queryable = new DatabaseQueryable<string>(fakeProvider1 as any, rootExpr);
  });

  it("count without predicate should use empty args", () => {
    const result = queryable.count();
    expect(result).toBe(42);
  });

  it("count with predicate should use args", () => {
    const result = queryable.count(x => x.length > 0);
    expect(result).toBe(99);
  });

  it("any without predicate should return false", () => {
    const result = queryable.any();
    expect(result).toBe(false);
  });

  it("any with predicate should return true", () => {
    const result = queryable.any(x => x === "a");
    expect(result).toBe(true);
  });

  it("first without predicate should return default", () => {
    const result = queryable.first();
    expect(result).toBe("firstDefault");
  });

  it("first with predicate should return withPredicate", () => {
    const result = queryable.first(x => x === "a");
    expect(result).toBe("firstWithPredicate");
  });

  it("firstOrDefault without predicate should return null", () => {
    const result = queryable.firstOrDefault();
    expect(result).toBeNull();
  });

  it("firstOrDefault with predicate should return value", () => {
    const result = queryable.firstOrDefault(x => x === "a");
    expect(result).toBe("firstOrDefaultWithPredicate");
  });

  it("single without predicate should return default", () => {
    const result = queryable.single();
    expect(result).toBe("singleDefault");
  });

  it("single with predicate should return withPredicate", () => {
    const result = queryable.single(x => x === "a");
    expect(result).toBe("singleWithPredicate");
  });

  it("singleOrDefault without predicate should return null", () => {
    const result = queryable.singleOrDefault();
    expect(result).toBeNull();
  });

  it("singleOrDefault with predicate should return value", () => {
    const result = queryable.singleOrDefault(x => x === "a");
    expect(result).toBe("singleOrDefaultWithPredicate");
  });
});
