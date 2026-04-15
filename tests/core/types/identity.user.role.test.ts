// tests/identity.user.role.test.ts
import { describe, it, expect } from "vitest";
import { IdentityUserRole } from "../../../src/core/types/index.js";

describe("IdentityUserRole", () => {
  it("should allow setting and getting userId and roleId", () => {
    const roleLink = new IdentityUserRole<string>();
    roleLink.userId = "user123";
    roleLink.roleId = "role456";

    expect(roleLink.userId).toBe("user123");
    expect(roleLink.roleId).toBe("role456");
  });

  it("should support different key types (number)", () => {
    const roleLink = new IdentityUserRole<number>();
    roleLink.userId = 1;
    roleLink.roleId = 99;

    expect(roleLink.userId).toBe(1);
    expect(roleLink.roleId).toBe(99);
  });

  it("should support different key types (object)", () => {
    type KeyType = { id: string };
    const roleLink = new IdentityUserRole<KeyType>();
    const userKey = { id: "u1" };
    const roleKey = { id: "r1" };

    roleLink.userId = userKey;
    roleLink.roleId = roleKey;

    expect(roleLink.userId).toEqual({ id: "u1" });
    expect(roleLink.roleId).toEqual({ id: "r1" });
  });
});
