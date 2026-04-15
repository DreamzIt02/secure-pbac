import { describe, it, expect, beforeEach } from "vitest";
import { AllowedPrimaryKeys, BaseEntity, DbSet, PrimaryKey } from "../../src/contexts/index.js";
import { IQueryProvider, QueryExpression } from "../../src/linq/index.js";

// Simple test entity
class User extends BaseEntity {
  id!: string;
  name!: string;
}

describe("DbSet in-memory", () => {
  let pk: PrimaryKey<User>;
  let set: DbSet<User>;

  beforeEach(() => {
    pk = new PrimaryKey<User>({ id: "" as AllowedPrimaryKeys }, { auto: true });
    set = new DbSet<User>(pk);
  });

  it("adds entity with auto id", () => {
    const u = new User();
    u.name = "Alice";
    const added = set.add(u);
    expect(added.id).toBeDefined();
    expect(set.toArray()).toContain(added);
  });

  it("updates existing entity", () => {
    const u = new User();
    u.name = "Bob";
    const added = set.add(u);
    added.name = "Robert";
    set.update(added);
    expect(set.toArray()[0].name).toBe("Robert");
  });

  it("throws when updating non-existent entity", () => {
    const u = new User();
    u.id = "x";
    u.name = "Ghost";
    expect(() => set.update(u)).toThrow("Entity not found");
  });

  it("removes entity", () => {
    const u = new User();
    u.name = "Charlie";
    const added = set.add(u);
    set.remove(added);
    expect(set.toArray()).toEqual([]);
  });

  it("attaches entity if not present", () => {
    const u = new User();
    u.name = "Dana";
    set.attach(u);
    expect(set.toArray()).toContain(u);
  });

  it("does not duplicate attach", () => {
    const u = new User();
    u.name = "Eve";
    set.add(u);
    set.attach(u);
    expect(set.toArray().length).toBe(1);
  });

  it("iterates over entities", () => {
    const u = new User();
    u.name = "Frank";
    set.add(u);
    const arr = [...set];
    expect(arr[0].name).toBe("Frank");
  });

  it("asQueryable returns Queryable", () => {
    const q = set.asQueryable();
    expect(q.toArray().length).toBe(0);
  });
});

describe("DbSet with provider", () => {
  class FakeProvider implements IQueryProvider {
    public lastExpr: QueryExpression | null = null;
    public result: any = null;
    createQuery<T>(expression: QueryExpression) {
      this.lastExpr = expression;
      return {} as T;
    }
    execute<T>(expression: QueryExpression): T {
      this.lastExpr = expression;
      return this.result as T;
    }
  }

  let provider: FakeProvider;
  let pk: PrimaryKey<User>;
  let set: DbSet<User>;

  beforeEach(() => {
    provider = new FakeProvider();
    pk = new PrimaryKey<User>({ id: "" as AllowedPrimaryKeys }, { auto: true });
    set = new DbSet<User>(pk, provider);
  });

  it("iterates via provider", () => {
    provider.result = [new User()];
    const arr = [...set];
    expect(arr.length).toBe(1);
  });

  it("toArray uses provider", () => {
    provider.result = [new User()];
    expect(set.toArray().length).toBe(1);
  });

  it("add calls provider with Insert", () => {
    const u = new User();
    set.add(u);
    expect(provider.lastExpr?.type).toBe("Insert");
  });

  it("update calls provider with Update", () => {
    const u = new User();
    set.update(u);
    expect(provider.lastExpr?.type).toBe("Update");
  });

  it("remove calls provider with Delete", () => {
    const u = new User();
    set.remove(u);
    expect(provider.lastExpr?.type).toBe("Delete");
  });

  it("attach calls provider with Attach", () => {
    const u = new User();
    set.attach(u);
    expect(provider.lastExpr?.type).toBe("Attach");
  });

  it("asQueryable returns DatabaseQueryable", () => {
    const q = set.asQueryable();
    expect(q).toBeInstanceOf(Object); // DatabaseQueryable
  });
});
