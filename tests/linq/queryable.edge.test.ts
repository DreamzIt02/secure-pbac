import { describe, it, expect } from "vitest";
import { Queryable } from "../../src/linq/index.js";

describe("Queryable edge cases", () => {
  it("handles empty source gracefully", () => {
    const empty = new Queryable<number>([]);
    expect(empty.toArray()).toEqual([]);
    expect(empty.count()).toBe(0);
    expect(empty.sum(x => x)).toBe(0);
    expect(empty.average(x => x)).toBe(0);
    expect(() => empty.min(x => x)).toThrow();
    expect(() => empty.max(x => x)).toThrow();
    expect(empty.any()).toBe(false);
    expect(empty.all(() => true)).toBe(true);
    expect(empty.first()).toBeNull();
    expect(empty.firstOrDefault()).toBeNull();
    expect(empty.singleOrDefault()).toBeNull();
    expect(() => empty.single()).toThrow();
  });

  it("skip with negative count yields full sequence", () => {
    const q = new Queryable([1, 2, 3]).skip(-2);
    expect(q.toArray()).toEqual([1, 2, 3]);
  });

  it("take with negative count yields empty sequence", () => {
    const q = new Queryable([1, 2, 3]).take(-1);
    expect(q.toArray()).toEqual([]);
  });

  it("groupBy on empty source yields empty groups", () => {
    const empty = new Queryable<number>([]);
    const groups = empty.groupBy(x => x % 2).toArray();
    expect(groups).toEqual([]);
  });

  it("join with empty outer or inner yields empty results", () => {
    const outer = new Queryable<number>([]);
    const inner = new Queryable<number>([1, 2]);
    const joined = outer.join(inner, o => o, i => i, (o, i) => o + i).toArray();
    expect(joined).toEqual([]);

    const outer2 = new Queryable<number>([1, 2]);
    const inner2 = new Queryable<number>([]);
    const joined2 = outer2.join(inner2, o => o, i => i, (o, i) => o + i).toArray();
    expect(joined2).toEqual([]);
  });

  it("single throws when multiple elements", () => {
    const q = new Queryable([1, 2]);
    expect(() => q.single()).toThrow("Sequence does not contain exactly one element");
  });

  it("singleOrDefault throws when multiple elements", () => {
    const q = new Queryable([1, 2]);
    expect(() => q.singleOrDefault()).toThrow("Sequence contains more than one element");
  });
});
