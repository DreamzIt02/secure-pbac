import { describe, it, expect } from "vitest";
import { BaseEntity, DbSet, PrimaryKey } from "../../src/contexts/index.js";

// Concrete entity using composite key
class UserRoleEntity extends BaseEntity {
  userId!: number;
  roleId!: number;
}

describe("DbSet with composite primary key", () => {
  it("compares entities with composite keys correctly", () => {
    const pk = new PrimaryKey<UserRoleEntity>({ userId: 0, roleId: 0 });
    const set = new DbSet<UserRoleEntity>(pk);

    const r1 = new UserRoleEntity();
    r1.userId = 1;
    r1.roleId = 10;

    const r2 = new UserRoleEntity();
    r2.userId = 1;
    r2.roleId = 10;

    const r3 = new UserRoleEntity();
    r3.userId = 2;
    r3.roleId = 10;

    // Add first entity
    set.add(r1);

    // Update with matching composite key should succeed
    r2.roleId = 10;
    set.update(r2);
    expect(set.toArray()[0].userId).toBe(1);

    // Remove with matching composite key should succeed
    set.remove(r2);
    expect(set.toArray().length).toBe(0);

    // Compare returns true for same composite keys, false otherwise
    expect(pk.compare(r1, r2)).toBe(true);
    expect(pk.compare(r1, r3)).toBe(false);
  });

  it("attach works with composite keys", () => {
    const pk = new PrimaryKey<UserRoleEntity>({ userId: 0, roleId: 0 });
    const set = new DbSet<UserRoleEntity>(pk);

    const r1 = new UserRoleEntity();
    r1.userId = 5;
    r1.roleId = 99;

    set.attach(r1);
    expect(set.toArray().length).toBe(1);
    expect(set.toArray()[0].userId).toBe(5);
    expect(set.toArray()[0].roleId).toBe(99);
  });
});
