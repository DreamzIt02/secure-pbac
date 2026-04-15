import { describe, it, expect, beforeEach } from "vitest";
import { UserStoreBase } from "../../../../src/core/extensions/user-stores/index.js";
import { IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserToken, UserLoginInfo } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { IdentityErrorDescriber, IdentityResult } from "../../../../src/core/identity/index.js";
import { Claim } from "../../../../src/claims/index.js";
import { ObjectDisposedException } from "../../../../src/types/exception.js";


// Fake concrete implementation
class FakeUserStore extends UserStoreBase<
  IdentityUser<string>,
  string,
  IdentityUserClaim<string>,
  IdentityUserLogin<string>,
  IdentityUserToken<string>
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
  async addClaimsAsync(user: IdentityUser<string>, claims: Claim[], ct: CancellationToken) {}
  async replaceClaimAsync(user: IdentityUser<string>, claim: Claim, newClaim: Claim, ct: CancellationToken) {}
  async removeClaimsAsync(user: IdentityUser<string>, claims: Claim[], ct: CancellationToken) {}
  async addLoginAsync(user: IdentityUser<string>, login: UserLoginInfo, ct: CancellationToken) {}
  async removeLoginAsync(user: IdentityUser<string>, lp: string, pk: string, ct: CancellationToken) {}
  async getLoginsAsync(user: IdentityUser<string>, ct: CancellationToken) { return []; }
  async findByEmailAsync(email: string, ct: CancellationToken) { return null; }
  async getUsersForClaimAsync(claim: Claim, ct: CancellationToken) { return []; }
  protected async findTokenAsync(user: IdentityUser<string>, lp: string, name: string, ct: CancellationToken) { return null; }
  protected async addUserTokenAsync(token: IdentityUserToken<string>) {}
  protected async removeUserTokenAsync(token: IdentityUserToken<string>) {}
}

describe("UserStoreBase", () => {
  let store: FakeUserStore;
  let user: IdentityUser<string>;

  beforeEach(() => {
    store = new FakeUserStore(new IdentityErrorDescriber());
    user = new IdentityUser<string>();
    user.id = "u1";
    user.userName = "alice";
    user.email = "a@example.com";
    user.passwordHash = null;
    user.accessFailedCount = 0;
    user.lockoutEnabled = false;
    user.twoFactorEnabled = false;
  });

  it("creates user claim/login/token", () => {
    const claim = new Claim("type", "value");
    const uc = store["createUserClaim"](IdentityUserClaim as any, user, claim);
    expect(uc.userId).toBe("u1");

    const login = new UserLoginInfo("prov", "key", "disp");
    const ul = store["createUserLogin"](IdentityUserLogin as any, user, login);
    expect(ul.userId).toBe("u1");

    const ut = store["createUserToken"](IdentityUserToken as any, user, "prov", "name", "val");
    expect(ut.userId).toBe("u1");
  });

  it("converts ids", () => {
    expect(store.convertIdFromString("abc")).toBe("abc");
    expect(store.convertIdFromString(null)).toBeNull();
    expect(store.convertIdToString("abc")).toBe("abc");
  });

  it("gets and sets user name", async () => {
    expect(await store.getUserNameAsync(user)).toBe("alice");
    await store.setUserNameAsync(user, "bob");
    expect(user.userName).toBe("bob");
    expect(await store.getNormalizedUserNameAsync(user)).toBe("BOB");
  });

  it("gets and sets email", async () => {
    expect(await store.getEmailAsync(user)).toBe("a@example.com");
    await store.setEmailAsync(user, "b@example.com");
    expect(user.email).toBe("b@example.com");
    await store.setEmailConfirmedAsync(user, true);
    expect(await store.getEmailConfirmedAsync(user)).toBe(true);
  });

  it("password methods", async () => {
    await store.setPasswordHashAsync(user, "hash");
    expect(await store.getPasswordHashAsync(user)).toBe("hash");
    expect(await store.hasPasswordAsync(user)).toBe(true);
  });

  it("lockout and access failed count", async () => {
    await store.setLockoutEnabledAsync(user, true);
    expect(await store.getLockoutEnabledAsync(user)).toBe(true);
    await store.incrementAccessFailedCountAsync(user);
    expect(await store.getAccessFailedCountAsync(user)).toBe(1);
    await store.resetAccessFailedCountAsync(user);
    expect(await store.getAccessFailedCountAsync(user)).toBe(0);
  });

  it("two factor and security stamp", async () => {
    await store.setTwoFactorEnabledAsync(user, true);
    expect(await store.getTwoFactorEnabledAsync(user)).toBe(true);
    await store.setSecurityStampAsync(user, "stamp");
    expect(await store.getSecurityStampAsync(user)).toBe("stamp");
  });

  it("token methods add and get", async () => {
    await store.setTokenAsync(user, "prov", "name", "val", CancellationToken.none);
    expect(await store.getTokenAsync(user, "prov", "name", CancellationToken.none)).toBeNull(); // stubbed
  });

  it("code methods", async () => {
    // stubbed getTokenAsync returns null, so countCodesAsync returns 0
    expect(await store.countCodesAsync(user, CancellationToken.none)).toBe(0);
    const redeemed = await store.redeemCodeAsync(user, "code", CancellationToken.none);
    expect(redeemed).toBe(false);
  });

  it("dispose prevents further use", async () => {
    store.dispose();
    await expect(store.getUserIdAsync(user))
        .rejects.toThrow(ObjectDisposedException);
  });

});
