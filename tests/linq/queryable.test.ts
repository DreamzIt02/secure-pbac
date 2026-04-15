import { describe, it, expect } from "vitest";
import { Queryable } from "../../src/linq/index.js";

describe("Queryable", () => {
  const numbers = new Queryable([1, 2, 3, 4, 5]);

  it("iterates with Symbol.iterator", () => {
    const arr = [...numbers];
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });

  it("filters with where", () => {
    const evens = numbers.where(n => n % 2 === 0).toArray();
    expect(evens).toEqual([2, 4]);
  });

  it("skip and take", () => {
    expect(numbers.skip(2).toArray()).toEqual([3, 4, 5]);
    expect(numbers.take(3).toArray()).toEqual([1, 2, 3]);
  });

  it("select and selectMany", () => {
    const doubled = numbers.select(n => n * 2).toArray();
    expect(doubled).toEqual([2, 4, 6, 8, 10]);

    const expanded = numbers.selectMany(n => [n, n]).toArray();
    expect(expanded).toEqual([1,1,2,2,3,3,4,4,5,5]);
  });

  it("orderBy and orderByDescending", () => {
    const shuffled = new Queryable([3,1,2]);
    expect(shuffled.orderBy(x => x).toArray()).toEqual([1,2,3]);
    expect(shuffled.orderByDescending(x => x).toArray()).toEqual([3,2,1]);
  });

  it("groupBy", () => {
    const grouped = numbers.groupBy(n => n % 2 === 0 ? "even" : "odd").toArray();
    const evenGroup = grouped.find(g => g.key === "even");
    expect(evenGroup?.items).toEqual([2,4]);
  });

  it("join", () => {
    const letters = new Queryable([{ id:1, name:"A" }, { id:2, name:"B" }]);
    const joined = numbers.join(
      letters,
      n => n,
      l => l.id,
      (n,l) => `${n}-${l.name}`
    ).toArray();
    expect(joined).toEqual(["1-A","2-B"]);
  });

  it("count, sum, average, min, max", () => {
    expect(numbers.count()).toBe(5);
    expect(numbers.count(n => n > 3)).toBe(2);
    expect(numbers.sum(n => n)).toBe(15);
    expect(numbers.average(n => n)).toBe(3);
    expect(numbers.min(n => n)).toBe(1);
    expect(numbers.max(n => n)).toBe(5);
  });

  it("any and all", () => {
    expect(numbers.any(n => n > 4)).toBe(true);
    expect(numbers.any(n => n > 10)).toBe(false);
    expect(numbers.all(n => n > 0)).toBe(true);
    expect(numbers.all(n => n < 3)).toBe(false);
  });

  it("first, firstOrDefault", () => {
    expect(numbers.first(n => n > 3)).toBe(4);
    expect(numbers.firstOrDefault(n => n > 10)).toBeNull();
  });

  it("single and singleOrDefault", () => {
    const one = new Queryable([42]);
    expect(one.single()).toBe(42);
    expect(one.singleOrDefault()).toBe(42);

    const empty = new Queryable<number>([]);
    expect(empty.singleOrDefault()).toBeNull();

    const two = new Queryable([1,2]);
    expect(() => two.single()).toThrow();
    expect(() => two.singleOrDefault()).toThrow();
  });

  it("find", () => {
    expect(numbers.find(n => n === 3)).toBe(3);
    expect(numbers.find(n => n === 10)).toBeNull();
  });

  it("toArray", () => {
    expect(numbers.toArray()).toEqual([1,2,3,4,5]);
  });
});
