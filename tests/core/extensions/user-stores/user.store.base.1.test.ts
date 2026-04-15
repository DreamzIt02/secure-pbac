import { describe, it, expect, beforeEach } from "vitest";
import { UserStoreBase1 } from "../../../../src/core/extensions/user-stores/index.js";
import { IdentityRole, IdentityUser, IdentityUserRole } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { IdentityResult } from "../../../../src/core/identity/index.js";

// Fake concrete implementation
class FakeUserStore1 extends UserStoreBase1<
  IdentityUser<string>,
  IdentityRole<string>,
  string,
  any,
  IdentityUserRole<string>,
  any,
  any,
  any
> {
  public users = { toArray: () => [] } as any;

  async createAsync(user: IdentityUser<string>, ct: CancellationToken) { return IdentityResult.success(); }
  async updateAsync(user: IdentityUser<string>, ct: CancellationToken) { return IdentityResult.success(); }
  async deleteAsync(user: IdentityUser<string>, ct: CancellationToken) { return IdentityResult.success(); }
  async findByIdAsync(id: string, ct: CancellationToken) { return null; }
  async findByNameAsync(name: string, ct: CancellationToken) { return null; }
  protected async findUserAsync(id: string, ct: CancellationToken) { return null; }
  protected async findUserLoginAsync(userIdOrProvider: any, providerKey?: any, ct?: any) { return null; }
  async getClaimsAsync(user: IdentityUser<string>, ct: CancellationToken) { return []; }
  async addClaimsAsync(user: IdentityUser<string>, claims: any[], ct: CancellationToken) {}
  async replaceClaimAsync(user: IdentityUser<string>, claim: any, newClaim: any, ct: CancellationToken) {}
  async removeClaimsAsync(user: IdentityUser<string>, claims: any[], ct: CancellationToken) {}
  async addLoginAsync(user: IdentityUser<string>, login: any, ct: CancellationToken) {}
  async removeLoginAsync(user: IdentityUser<string>, lp: string, pk: string, ct: CancellationToken) {}
  async getLoginsAsync(user: IdentityUser<string>, ct: CancellationToken) { return []; }
  async findByEmailAsync(email: string, ct: CancellationToken) { return null; }
  async getUsersForClaimAsync(claim: any, ct: CancellationToken) { return []; }
  protected async findTokenAsync(user: IdentityUser<string>, lp: string, name: string, ct: CancellationToken) { return null; }
  protected async addUserTokenAsync(token: any) {}
  protected async removeUserTokenAsync(token: any) {}

  // Role-specific methods
  async getUsersInRoleAsync(normalizedRoleName: string, ct: CancellationToken) { return []; }
  async addToRoleAsync(user: IdentityUser<string>, normalizedRoleName: string, ct: CancellationToken) {}
  async removeFromRoleAsync(user: IdentityUser<string>, normalizedRoleName: string, ct: CancellationToken) {}
  async getRolesAsync(user: IdentityUser<string>, ct: CancellationToken) { return ["ADMIN"]; }
  async isInRoleAsync(user: IdentityUser<string>, normalizedRoleName: string, ct: CancellationToken) { return normalizedRoleName === "ADMIN"; }
  protected async findRoleAsync(normalizedRoleName: string, ct: CancellationToken) { return new IdentityRole<string>(); }
  protected async findUserRoleAsync(userId: string, roleId: string, ct: CancellationToken) { return new IdentityUserRole<string>(); }
}

describe("UserStoreBase1", () => {
  let store: FakeUserStore1;
  let user: IdentityUser<string>;
  let role: IdentityRole<string>;

  beforeEach(() => {
    store = new FakeUserStore1({} as any);
    user = new IdentityUser<string>();
    user.id = "u1";
    role = new IdentityRole<string>();
    role.id = "r1";
  });

  it("creates user role correctly", () => {
    const ur = store["createUserRole"](IdentityUserRole as any, user, role);
    expect(ur.userId).toBe("u1");
    expect(ur.roleId).toBe("r1");
  });

  it("gets users in role", async () => {
    const users = await store.getUsersInRoleAsync("ADMIN", CancellationToken.none);
    expect(users).toEqual([]);
  });

  it("adds and removes role", async () => {
    await expect(store.addToRoleAsync(user, "ADMIN", CancellationToken.none)).resolves.toBeUndefined();
    await expect(store.removeFromRoleAsync(user, "ADMIN", CancellationToken.none)).resolves.toBeUndefined();
  });

  it("gets roles and checks membership", async () => {
    const roles = await store.getRolesAsync(user, CancellationToken.none);
    expect(roles).toContain("ADMIN");
    const inRole = await store.isInRoleAsync(user, "ADMIN", CancellationToken.none);
    expect(inRole).toBe(true);
  });

  it("finds role and user role", async () => {
    const r = await store["findRoleAsync"]("ADMIN", CancellationToken.none);
    expect(r).toBeInstanceOf(IdentityRole);
    const ur = await store["findUserRoleAsync"]("u1", "r1", CancellationToken.none);
    expect(ur).toBeInstanceOf(IdentityUserRole);
  });
});
