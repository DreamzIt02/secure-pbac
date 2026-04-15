import { describe, it, expect } from "vitest";
import { BaseEntity, PrimaryKey } from "../../src/contexts/index.js";

// Simple entity type for testing
class TestEntity extends BaseEntity {
  id?: string | number | bigint;
}

describe("PrimaryKey", () => {
  // ───────────────────────────────────────────────
  // Constructor validation
  // ───────────────────────────────────────────────
  it("accepts string, number, and bigint keys", () => {
    expect(() => new PrimaryKey<TestEntity>({ id: "string" })).not.toThrow();
    expect(() => new PrimaryKey<TestEntity>({ id: "number" })).not.toThrow();
    expect(() => new PrimaryKey<TestEntity>({ id: "bigint" })).not.toThrow();
  });

  it("throws error for unsupported type", () => {
    expect(() => new PrimaryKey<TestEntity>({ id: true as any })).toThrow();
  });

  // ───────────────────────────────────────────────
  // Compare
  // ───────────────────────────────────────────────
  it("compares equal entities", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = { id: "abc" } as TestEntity;
    const e2 = { id: "abc" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(true);
  });

  it("compares unequal entities", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = { id: "abc" } as TestEntity;
    const e2 = { id: "def" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(false);
  });

  it("returns false if key missing", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = {} as TestEntity;
    const e2 = { id: "abc" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(false);
  });

  // ───────────────────────────────────────────────
  // Resolve
  // ───────────────────────────────────────────────
  it("resolves auto string id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(typeof entity.id).toBe("string");
    expect(entity.id).toHaveLength(36); // UUID length
  });

  it("resolves auto number id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "number" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(entity.id).toBe(1);
    const entity2 = pk.resolve({} as TestEntity);
    expect(entity2.id).toBe(2); // increments
  });

  it("resolves auto bigint id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "bigint" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(entity.id).toBe(1n);
    const entity2 = pk.resolve({} as TestEntity);
    expect(entity2.id).toBe(2n);
  });

  it("does nothing when auto=false", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" }, { auto: false });
    const entity = { id: "manual" } as TestEntity;
    const result = pk.resolve(entity);
    expect(result.id).toBe("manual");
  });
  
  // ───────────────────────────────────────────────
  // Constructor validation with type names
  // ───────────────────────────────────────────────
  it("accepts string, number, and bigint type names", () => {
    expect(() => new PrimaryKey<TestEntity>({ id: "string" })).not.toThrow();
    expect(() => new PrimaryKey<TestEntity>({ id: "number" })).not.toThrow();
    expect(() => new PrimaryKey<TestEntity>({ id: "bigint" })).not.toThrow();
  });

  // ───────────────────────────────────────────────
  // Constructor validation with sample values
  // ───────────────────────────────────────────────
  it("accepts sample values for keys", () => {
    expect(() => new PrimaryKey<TestEntity>({ id: "abc" as any })).not.toThrow();   // string sample
    expect(() => new PrimaryKey<TestEntity>({ id: 123 as any })).not.toThrow();     // number sample
    expect(() => new PrimaryKey<TestEntity>({ id: 123n as any })).not.toThrow();    // bigint sample
  });

  it("throws error for unsupported sample type", () => {
    expect(() => new PrimaryKey<TestEntity>({ id: true as any })).toThrow();
  });

  // ───────────────────────────────────────────────
  // Compare
  // ───────────────────────────────────────────────
  it("compares equal entities", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = { id: "abc" } as TestEntity;
    const e2 = { id: "abc" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(true);
  });

  it("compares unequal entities", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = { id: "abc" } as TestEntity;
    const e2 = { id: "def" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(false);
  });

  it("returns false if key missing", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" });
    const e1 = {} as TestEntity;
    const e2 = { id: "abc" } as TestEntity;
    expect(pk.compare(e1, e2)).toBe(false);
  });

  // ───────────────────────────────────────────────
  // Resolve
  // ───────────────────────────────────────────────
  it("resolves auto string id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(typeof entity.id).toBe("string");
    expect(entity.id).toHaveLength(36); // UUID length
  });

  it("resolves auto number id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "number" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(entity.id).toBe(1);
    const entity2 = pk.resolve({} as TestEntity);
    expect(entity2.id).toBe(2);
  });

  it("resolves auto bigint id", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "bigint" }, { auto: true });
    const entity = pk.resolve({} as TestEntity);
    expect(entity.id).toBe(1n);
    const entity2 = pk.resolve({} as TestEntity);
    expect(entity2.id).toBe(2n);
  });

  it("does nothing when auto=false", () => {
    const pk = new PrimaryKey<TestEntity>({ id: "string" }, { auto: false });
    const entity = { id: "manual" } as TestEntity;
    const result = pk.resolve(entity);
    expect(result.id).toBe("manual");
  });
});
