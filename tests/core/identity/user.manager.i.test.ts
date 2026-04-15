import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser, UserLoginInfo } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
import { IdentityErrorDescriber, IdentityResult, UserManager } from "../../../src/core/identity/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { Claim } from "../../../src/claims/index.js";
import { PasswordValidator, UserValidator } from "../../../src/core/validators/index.js";
import { CancellationToken } from "../../../src/types/cancellation.js";
import { randomUUID } from "../../../src/utils.js";

// Dummy user
class TestUser extends IdentityUser<string> {
  constructor() {
    super();
    this.id = "u1";
    this.userName = "rejwanul";
    this.passwordHash = null;
    this.securityStamp = "stamp";
  }
}

class TestRole extends IdentityRole<string> {
  constructor();
  constructor(id: string, name: string);
  constructor(id?: string, name?: string) {
    super(name);
    this.id = id ?? "";
  }
}

class FakeContext extends InMemoryContext<TestUser, TestRole, string> {
  constructor();
  constructor(options: DbContextOptions);
  constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }
  protected override onModelCreating(): void {
    super.onModelCreating(new ModelBuilder());
    // Override 
    this.users = this.register(TestUser, new PrimaryKey({ id: "string" }, { auto: false }));
    this.roles = this.register(TestRole, new PrimaryKey({ id: "string" }, { auto: false }));
  }
}

class FakeStore extends InMemoryUserStore<string, TestUser, TestRole, InMemoryContext<TestUser, TestRole, string>> {
  constructor(options: DbContextOptions) {
    super(FakeContext, TestUser, TestRole, options);
  }

  protected override async findRoleAsync(normalizedRoleName: string, cancellationToken: CancellationToken) {
    let role = await this.roles.find(r => r.normalizedName === normalizedRoleName);
    if (!role)
      this.context.add(new TestRole(randomUUID().substring(0, 4).toString(), normalizedRoleName))
    return await this.roles.find(r => r.normalizedName === normalizedRoleName)
  }
}

// Fake password hasher
class FakeHasher extends PasswordHasher<TestUser> {
  constructor() {
    super()
  }
}

// Fake normalizer
class FakeNormalizer extends LookupNormalizer {
    constructor() {
        super()
    }
}

describe("UserManager claims, roles, tokens, recovery codes", () => {
  let manager: UserManager<string, TestUser>;
  let user: TestUser;
  let store: FakeStore;

  const optionsAccessor = { value: new IdentityOptions() };
  const hasher = new FakeHasher();
  const errorDescriber = new IdentityErrorDescriber();

  beforeEach(() => {
    store = new FakeStore(new DbContextOptions(optionsAccessor.value));
    manager = new UserManager(
      store,
      optionsAccessor,
      hasher,
      [new UserValidator(errorDescriber)],
      [new PasswordValidator(errorDescriber)],
      new FakeNormalizer(),
      errorDescriber
    );
    user = new TestUser();
  });

  afterEach(() => {
    store.dispose()
  });

  it("getUsersForClaimAsync returns users", async () => {
    await manager.createAsync(user);
    await manager.addClaimAsync(user, new Claim("t", "v"));
    const result = await manager.getUsersForClaimAsync(new Claim("t", "v"));
    expect(result).toContain(user);
  });

  it("getUsersInRoleAsync returns users", async () => {
    await manager.createAsync(user);
    await manager.addToRoleAsync(user, "admin");
    const result = await manager.getUsersInRoleAsync("admin");
    expect(result).toContain(user);
  });

  it("getAuthenticationTokenAsync returns token", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "exists", "display");
    await manager.addLoginAsync(user, login);
    await manager.setAuthenticationTokenAsync(user, login.loginProvider, "token1", "TokenValue")
    const token = await manager.getAuthenticationTokenAsync(user, login.loginProvider, "token1");
    expect(token).toBe("TokenValue");
  });

  it("setAuthenticationTokenAsync returns success", async () => {
    const result = await manager.setAuthenticationTokenAsync(user, "provider", "name", "value");
    expect(result.succeeded).toBe(true);
  });

  it("removeAuthenticationTokenAsync returns success", async () => {
    const result = await manager.removeAuthenticationTokenAsync(user, "provider", "name");
    expect(result.succeeded).toBe(true);
  });

  it("getAuthenticatorKeyAsync returns key", async () => {
    await manager.createAsync(user);
    await manager.resetAuthenticatorKeyAsync(user)
    const key = await manager.getAuthenticatorKeyAsync(user);
    expect(key).toBeTypeOf("string");
    expect(key?.length).toBeGreaterThan(1);
  });

  it("resetAuthenticatorKeyAsync returns success", async () => {
    const result = await manager.resetAuthenticatorKeyAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("generateNewAuthenticatorKey returns string", () => {
    const key = manager.generateNewAuthenticatorKey();
    expect(typeof key).toBe("string");
  });

  it("generateNewTwoFactorRecoveryCodesAsync returns codes", async () => {
    const codes = await manager.generateNewTwoFactorRecoveryCodesAsync(user, 3);
    expect(codes).toHaveLength(3);
  });

  it("createTwoFactorRecoveryCode returns string with dash", () => {
    const code = (manager as any).createTwoFactorRecoveryCode();
    expect(code).toMatch(/-/);
  });

  it("redeemTwoFactorRecoveryCodeAsync succeeds with valid code", async () => {
    await manager.createAsync(user);
    const codes = await manager.generateNewTwoFactorRecoveryCodesAsync(user, 5) ?? [];
    const result = await manager.redeemTwoFactorRecoveryCodeAsync(user, codes[0]);
    expect(result.succeeded).toBe(true);
  });

  it("redeemTwoFactorRecoveryCodeAsync fails with invalid code", async () => {
    const result = await manager.redeemTwoFactorRecoveryCodeAsync(user, "invalid");
    expect(result.succeeded).toBe(false);
  });

  it("countRecoveryCodesAsync returns number", async () => {
    await manager.createAsync(user);
    await manager.generateNewTwoFactorRecoveryCodesAsync(user, 5);
    const count = await manager.countRecoveryCodesAsync(user);
    expect(count).toBe(5);
  });
});
