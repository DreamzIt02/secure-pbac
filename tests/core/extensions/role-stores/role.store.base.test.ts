import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole, IdentityRoleClaim } from "../../../../src/core/types/index.js";
import { RoleStoreBase } from "../../../../src/core/extensions/role-stores/index.js";
import { IdentityErrorDescriber, IdentityResult } from "../../../../src/core/identity/index.js";
import { Claim } from "../../../../src/claims/index.js";

// Dummy role and claim classes
class TestRole extends IdentityRole<string> {
  constructor() {
    super();
    this.id = "role1";
    this.name = "admin";
  }
}
class TestRoleClaim extends IdentityRoleClaim<string> {}

class TestRoleStore extends RoleStoreBase<TestRole, string, any, TestRoleClaim> {
  public roles: any = [];
  async createAsync(role: TestRole): Promise<IdentityResult> {
    return IdentityResult.success();
  }
  async updateAsync(role: TestRole): Promise<IdentityResult> {
    return IdentityResult.success();
  }
  async deleteAsync(role: TestRole): Promise<IdentityResult> {
    return IdentityResult.success();
  }
  async findByIdAsync(id: string): Promise<TestRole | null> {
    return id === "role1" ? new TestRole() : null;
  }
  async findByNameAsync(name: string): Promise<TestRole | null> {
    return name === "ADMIN" ? new TestRole() : null;
  }
  async getClaimsAsync(role: TestRole): Promise<Claim[]> {
    return [new Claim("perm", "read")];
  }
  async addClaimAsync(role: TestRole, claim: Claim): Promise<void> {
    role.name = claim.type;
  }
  async removeClaimAsync(role: TestRole, claim: Claim): Promise<void> {
    role.name = "";
  }
}

describe("RoleStoreBase", () => {
  let store: TestRoleStore;
  let role: TestRole;

  beforeEach(() => {
    store = new TestRoleStore(new IdentityErrorDescriber());
    role = new TestRole();
  });

  it("constructor throws if describer is null", () => {
    expect(() => new TestRoleStore(null as any)).toThrow();
  });

  it("getRoleIdAsync returns id", async () => {
    const id = await store.getRoleIdAsync(role);
    expect(id).toBe("role1");
  });

  it("getRoleNameAsync returns name", async () => {
    const name = await store.getRoleNameAsync(role);
    expect(name).toBe("admin");
  });

  it("setRoleNameAsync sets name", async () => {
    await store.setRoleNameAsync(role, "editor");
    expect(role.name).toBe("editor");
  });

  it("convertIdFromString returns typed key", () => {
    const id = store.convertIdFromString<string>("abc");
    expect(id).toBe("abc");
  });

  it("convertIdToString returns string", () => {
    const str = store.convertIdToString("xyz");
    expect(str).toBe("xyz");
  });

  it("getNormalizedRoleNameAsync returns uppercase", async () => {
    const norm = await store.getNormalizedRoleNameAsync(role);
    expect(norm).toBe("ADMIN");
  });

  it("setNormalizedRoleNameAsync does not throw", async () => {
    await expect(store.setNormalizedRoleNameAsync(role, "ADMIN")).resolves.toBeUndefined();
  });

  it("dispose marks store as disposed", () => {
    store.dispose();
    expect(() => store.getRoleIdAsync(role)).rejects.toThrow();
  });

  it("createRoleClaim creates claim entity", () => {
    const claim = new Claim("perm", "write");
    const rc = (store as any).createRoleClaim(TestRoleClaim, role, claim);
    expect(rc.roleId).toBe("role1");
    expect(rc.claimType).toBe("perm");
    expect(rc.claimValue).toBe("write");
  });

  it("findByIdAsync returns role when id matches", async () => {
    const found = await store.findByIdAsync("role1");
    expect(found).toBeInstanceOf(TestRole);
  });

  it("findByNameAsync returns role when name matches", async () => {
    const found = await store.findByNameAsync("ADMIN");
    expect(found).toBeInstanceOf(TestRole);
  });

  it("getClaimsAsync returns claims", async () => {
    const claims = await store.getClaimsAsync(role);
    expect(claims[0]).toBeInstanceOf(Claim);
  });

  it("addClaimAsync modifies role", async () => {
    await store.addClaimAsync(role, new Claim("perm", "read"));
    expect(role.name).toBe("perm");
  });

  it("removeClaimAsync clears role name", async () => {
    role.name = "perm";
    await store.removeClaimAsync(role, new Claim("perm", "read"));
    expect(role.name).toBe("");
  });
});
