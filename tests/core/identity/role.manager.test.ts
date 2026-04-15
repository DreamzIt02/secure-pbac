import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole } from "../../../src/core/types/index.js";
import { IdentityErrorDescriber, IdentityResult, RoleManager } from "../../../src/core/identity/index.js";
import { Claim } from "../../../src/claims/index.js";
import { LookupNormalizer } from "../../../src/core/extensions/index.js";

// Dummy role
class TestRole extends IdentityRole<string> {
  constructor() {
    super();
    this.id = "r1";
    this.name = "admin";
  }
}

// Fake store implementing needed methods
class FakeStore {
  roles = [new TestRole()];
  async createAsync(role: TestRole) { return IdentityResult.success(); }
  async updateAsync(role: TestRole) { return IdentityResult.success(); }
  async deleteAsync(role: TestRole) { return IdentityResult.success(); }
  async findByIdAsync(id: string) { return id === "r1" ? new TestRole() : null; }
  async findByNameAsync(name: string) { return name === "ADMIN" ? new TestRole() : null; }
  async getRoleNameAsync(role: TestRole) { return role.name; }
  async setRoleNameAsync(role: TestRole, name: string) { role.name = name; }
  async getRoleIdAsync(role: TestRole) { return role.id; }
  async addClaimAsync(role: TestRole, claim: Claim) {}
  async removeClaimAsync(role: TestRole, claim: Claim) {}
  async getClaimsAsync(role: TestRole) { return [new Claim("perm","read")]; }
  dispose() {}
}

// Dummy normalizer
class Normalizer {
  normalizeName(name: string | null) { return name?.toUpperCase() ?? null; }
}

// Dummy validator
class AlwaysFailValidator {
  async validateAsync(manager: any, role: TestRole) {
    return IdentityResult.failed([{ code: "fail", description: "bad role" }]);
  }
}

describe("RoleManager", () => {
  let store: FakeStore;
  let manager: RoleManager<string, TestRole>;
  let role: TestRole;

  beforeEach(() => {
    store = new FakeStore();
    manager = new RoleManager(store as any, null, new LookupNormalizer(), new IdentityErrorDescriber());
    role = new TestRole();
  });

  it("constructor throws if store is null", () => {
    expect(() => new RoleManager(null as any, null, new LookupNormalizer(), new IdentityErrorDescriber())).toThrow();
  });

  it("supportsQueryableRoles and supportsRoleClaims return true", () => {
    expect(manager.supportsQueryableRoles).toBe(true);
    expect(manager.supportsRoleClaims).toBe(true);
  });

  it("roles property returns queryable roles", () => {
    expect(manager.roles).toContainEqual(expect.any(TestRole));
  });

  it("createAsync succeeds", async () => {
    const result = await manager.createAsync(role);
    expect(result.succeeded).toBe(true);
  });

  it("updateAsync succeeds", async () => {
    const result = await manager.updateAsync(role);
    expect(result.succeeded).toBe(true);
  });

  it("deleteAsync succeeds", async () => {
    const result = await manager.deleteAsync(role);
    expect(result.succeeded).toBe(true);
  });

  it("roleExistsAsync returns true when role found", async () => {
    const exists = await manager.roleExistsAsync("admin");
    expect(exists).toBe(true);
  });

  it("normalizeKey uppercases name", () => {
    expect(manager.normalizeKey("abc")).toBe("ABC");
  });

  it("findByIdAsync returns role", async () => {
    const found = await manager.findByIdAsync("r1");
    expect(found).toBeInstanceOf(TestRole);
  });

  it("getRoleNameAsync returns name", async () => {
    const name = await manager.getRoleNameAsync(role);
    expect(name).toBe("admin");
  });

  it("setRoleNameAsync sets name", async () => {
    await manager.setRoleNameAsync(role, "editor");
    expect(role.name).toBe("editor");
  });

  it("getRoleIdAsync returns id", async () => {
    const id = await manager.getRoleIdAsync(role);
    expect(id).toBe("r1");
  });

  it("findByNameAsync returns role", async () => {
    const found = await manager.findByNameAsync("admin");
    expect(found).toBeInstanceOf(TestRole);
  });

  it("addClaimAsync succeeds", async () => {
    const result = await manager.addClaimAsync(role, new Claim("perm","write"));
    expect(result.succeeded).toBe(true);
  });

  it("removeClaimAsync succeeds", async () => {
    const result = await manager.removeClaimAsync(role, new Claim("perm","read"));
    expect(result.succeeded).toBe(true);
  });

  it("getClaimsAsync returns claims", async () => {
    const claims = await manager.getClaimsAsync(role);
    expect(claims[0]).toBeInstanceOf(Claim);
  });

  it("dispose marks manager as disposed", () => {
    manager.dispose();
    expect(() => manager.supportsQueryableRoles).toThrow();
  });

  it("validateRoleAsync fails with validator", async () => {
    const failingManager = new RoleManager(store as any, [new AlwaysFailValidator()], new LookupNormalizer(), new IdentityErrorDescriber());
    const result = await failingManager.createAsync(role);
    expect(result.succeeded).toBe(false);
  });
});
