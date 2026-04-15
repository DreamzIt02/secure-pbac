import { describe, it, expect, beforeEach } from "vitest";
import { IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserToken, UserLoginInfo } from "../../../../src/core/types/index.js";
import { UserStoreBase } from "../../../../src/core/extensions/user-stores/index.js";
import { IdentityErrorDescriber, IdentityResult } from "../../../../src/core/identity/index.js";
import { Claim } from "../../../../src/claims/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";

// Dummy user class
class TestUser extends IdentityUser<string> {
  constructor() {
    super();
    this.id = "u1";
    this.userName = "rejwanul";
    this.passwordHash = null;
    this.email = "test@example.com";
    this.emailConfirmed = false;
    this.lockoutEnabled = false;
    this.accessFailedCount = 0;
    this.phoneNumber = null;
    this.phoneNumberConfirmed = false;
    this.securityStamp = null;
    this.twoFactorEnabled = false;
  }
}
class TestClaim extends IdentityUserClaim<string> {}
class TestLogin extends IdentityUserLogin<string> {}
class TestToken extends IdentityUserToken<string> {}

class TestStore extends UserStoreBase<TestUser, string, TestClaim, TestLogin, TestToken> {
  public users: any = [];
  async createAsync(user: TestUser) { return IdentityResult.success(); }
  async updateAsync(user: TestUser) { return IdentityResult.success(); }
  async deleteAsync(user: TestUser) { return IdentityResult.success(); }
  async findByIdAsync(id: string) { return new TestUser(); }
  async findByNameAsync(name: string) { return new TestUser(); }
  async getClaimsAsync(user: TestUser) { return [new Claim("perm","read")]; }
  async addClaimsAsync(user: TestUser, claims: Claim[]) {}
  async replaceClaimAsync(user: TestUser, claim: Claim, newClaim: Claim) {}
  async removeClaimsAsync(user: TestUser, claims: Claim[]) {}
  async addLoginAsync(user: TestUser, login: UserLoginInfo) {}
  async removeLoginAsync(user: TestUser, lp: string, pk: string) {}
  async getLoginsAsync(user: TestUser) { return []; }
  async findByEmailAsync(email: string) { return new TestUser(); }
  async getUsersForClaimAsync(claim: Claim) { return [new TestUser()]; }
  protected async findUserAsync(id: string) { return new TestUser(); }
  protected async findUserLoginAsync(lp: string, pk: string): Promise<TestLogin>;
  protected async findUserLoginAsync(userId: string, lp: string, pk: string): Promise<TestLogin>;
  protected async findUserLoginAsync(userId: string, lp: string, pk?: string) { return new TestLogin(); }
  protected async findTokenAsync(user: TestUser, lp: string, name: string) { return null; }
  protected async addUserTokenAsync(token: TestToken) {}
  protected async removeUserTokenAsync(token: TestToken) {}
}

describe("UserStoreBase", () => {
  let store: TestStore;
  let user: TestUser;

  beforeEach(() => {
    store = new TestStore(new IdentityErrorDescriber());
    user = new TestUser();
  });

  it("constructor throws if describer is null", () => {
    expect(() => new TestStore(null as any)).toThrow();
  });

  it("getUserIdAsync returns id", async () => {
    expect(await store.getUserIdAsync(user)).toBe("u1");
  });

  it("getUserNameAsync and setUserNameAsync", async () => {
    expect(await store.getUserNameAsync(user)).toBe("rejwanul");
    await store.setUserNameAsync(user, "newname");
    expect(user.userName).toBe("newname");
  });

  it("normalized user name", async () => {
    expect(await store.getNormalizedUserNameAsync(user)).toBe("REJWANUL");
    await store.setNormalizedUserNameAsync(user, "REJWANUL");
  });

  it("password methods", async () => {
    await store.setPasswordHashAsync(user, "hash");
    expect(await store.getPasswordHashAsync(user)).toBe("hash");
    expect(await store.hasPasswordAsync(user)).toBe(true);
  });

  it("email methods", async () => {
    await store.setEmailAsync(user, "new@example.com");
    expect(await store.getEmailAsync(user)).toBe("new@example.com");
    await store.setEmailConfirmedAsync(user, true);
    expect(await store.getEmailConfirmedAsync(user)).toBe(true);
  });

  it("lockout methods", async () => {
    await store.setLockoutEndDateAsync(user, new Date());
    expect(await store.getLockoutEndDateAsync(user)).toBeInstanceOf(Date);
    await store.incrementAccessFailedCountAsync(user);
    expect(await store.getAccessFailedCountAsync(user)).toBe(1);
    await store.resetAccessFailedCountAsync(user);
    expect(await store.getAccessFailedCountAsync(user)).toBe(0);
    await store.setLockoutEnabledAsync(user, true);
    expect(await store.getLockoutEnabledAsync(user)).toBe(true);
  });

  it("phone methods", async () => {
    await store.setPhoneNumberAsync(user, "123");
    expect(await store.getPhoneNumberAsync(user)).toBe("123");
    await store.setPhoneNumberConfirmedAsync(user, true);
    expect(await store.getPhoneNumberConfirmedAsync(user)).toBe(true);
  });

  it("security stamp and two factor", async () => {
    await store.setSecurityStampAsync(user, "stamp");
    expect(await store.getSecurityStampAsync(user)).toBe("stamp");
    await store.setTwoFactorEnabledAsync(user, true);
    expect(await store.getTwoFactorEnabledAsync(user)).toBe(true);
  });

  it("token methods", async () => {
    await store.setTokenAsync(user, "lp", "name", "val", CancellationToken.none);
    expect(await store.getTokenAsync(user, "lp", "name", CancellationToken.none)).toBeNull();
    await store.removeTokenAsync(user, "lp", "name", CancellationToken.none);
  });

  it("authenticator and recovery codes", async () => {
    await store.setAuthenticatorKeyAsync(user, "key", CancellationToken.none);
    expect(await store.getAuthenticatorKeyAsync(user, CancellationToken.none)).toBeNull();
    expect(await store.countCodesAsync(user, CancellationToken.none)).toBe(0);
    await store.replaceCodesAsync(user, ["a","b"], CancellationToken.none);
    expect(await store.redeemCodeAsync(user, "a", CancellationToken.none)).toBe(false);
  });

  it("dispose prevents further use", async () => {
    store.dispose();
    await expect(store.getUserIdAsync(user)).rejects.toThrow();
  });
});
