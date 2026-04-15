import { describe, it, expect } from "vitest";
import { BaseEntity, DbSet, PrimaryKey } from "../../src/contexts/index.js";

// Simple entity with numeric id
class Product extends BaseEntity {
  id!: number;
  name!: string;
}

describe("PrimaryKey auto-increment numeric keys", () => {
  it("assigns incrementing numeric ids when auto option is true", () => {
    const pk = new PrimaryKey<Product>({ id: 0 }, { auto: true });
    const set = new DbSet<Product>(pk);

    const p1 = new Product();
    p1.name = "Widget";
    set.add(p1);

    const p2 = new Product();
    p2.name = "Gadget";
    set.add(p2);

    const arr = set.toArray();
    expect(typeof arr[0].id).toBe("number");
    expect(typeof arr[1].id).toBe("number");
    expect(arr[0].id).toBe(1);
    expect(arr[1].id).toBe(2);
  });

  it("resolves bigint keys with auto option", () => {
    class BigEntity extends BaseEntity {
      id!: bigint;
    }
    const pk = new PrimaryKey<BigEntity>({ id: BigInt(0) }, { auto: true });
    const set = new DbSet<BigEntity>(pk);

    const e1 = new BigEntity();
    set.add(e1);
    const e2 = new BigEntity();
    set.add(e2);

    const arr = set.toArray();
    expect(typeof arr[0].id).toBe("bigint");
    expect(arr[0].id).toBe(BigInt(1));
    expect(arr[1].id).toBe(BigInt(2));
  });
});
