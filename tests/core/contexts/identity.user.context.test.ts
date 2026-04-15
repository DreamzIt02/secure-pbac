import { describe, it, expect, beforeEach } from "vitest";
import { IdentityUserContext } from "../../../src/core/contexts/index.js";
import { IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserToken } from "../../../src/core/types/index.js";
import { DbContextOptions } from "../../../src/contexts/index.js";
import { CancellationToken } from "../../../src/types/cancellation.js";
import { IdentityOptions, StoreOptions, Version } from "../../../src/core/options/index.js";

class TestUser extends IdentityUser<string> {
  id!: string;
}
class TestClaim extends IdentityUserClaim<string> {
  userId!: string;
  claimType!: string;
}
class TestLogin extends IdentityUserLogin<string> {
  userId!: string;
  loginProvider!: string;
}
class TestToken extends IdentityUserToken<string> {
  userId!: string;
  loginProvider!: string;
}

describe("IdentityUserContext", () => {
  let ctx: IdentityUserContext<TestUser, string, TestClaim, TestLogin, TestToken>;

  beforeEach(() => {
    ctx = new (class extends IdentityUserContext<TestUser, string, TestClaim, TestLogin, TestToken> {
      protected override getStoreOptions() {
        const identityOptions = new IdentityOptions();
        const storeOptions = new StoreOptions();
        storeOptions.schemaVersion = new Version(3, 0);
        identityOptions.stores = storeOptions;
        return identityOptions.stores;
      }
    })(new DbContextOptions());
  });

  it("constructs with options", () => {
    expect(ctx).toBeInstanceOf(IdentityUserContext);
  });

  it("constructs with no options", () => {
    const ctx2 = new (class extends IdentityUserContext<TestUser, string, TestClaim, TestLogin, TestToken> {} )();
    expect(ctx2).toBeInstanceOf(IdentityUserContext);
  });

  it("sets schemaVersion default", () => {
    expect(ctx["schemaVersion"]).toBeDefined();
  });

  it("registers users and claims in version3", () => {
    ctx["onModelCreatingVersion3"]({} as any);
    expect(ctx.users).toBeDefined();
    expect(ctx.userClaims).toBeDefined();
    expect(ctx.userLogins).toBeDefined();
    expect(ctx.userTokens).toBeDefined();
  });

  it("registers users and claims in version2", () => {
    ctx["onModelCreatingVersion2"]({} as any);
    expect(ctx.users).toBeDefined();
    expect(ctx.userClaims).toBeDefined();
  });

  it("registers users and claims in version1", () => {
    ctx["onModelCreatingVersion1"]({} as any);
    expect(ctx.users).toBeDefined();
    expect(ctx.userClaims).toBeDefined();
  });

  it("saveChangesAsync completes when not cancelled", async () => {
    const token = new CancellationToken();
    await expect(ctx.saveChangesAsync(token)).resolves.toBeUndefined();
  });

  it("saveChangesAsync throws when cancelled", async () => {
    const token = new CancellationToken();
    token.cancel();
    await expect(ctx.saveChangesAsync(token)).rejects.toThrow();
  });
});
