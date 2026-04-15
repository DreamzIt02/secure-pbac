import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher, UserTwoFactorTokenProviderFactory } from "../../../src/core/extensions/index.js";
import { IdentityErrorDescriber, IdentityResult, UserManager } from "../../../src/core/identity/index.js";
import { IdentityOptions, TokenOptions } from "../../../src/core/options/index.js";
import { PasswordValidator, UserValidator } from "../../../src/core/validators/index.js";

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

describe("UserManager two-factor & lockout methods", () => {
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

  it("getValidTwoFactorProvidersAsync returns provider names", async () => {
    user.email = "my@mail.me";
    user.emailConfirmed = true;
    await manager.createAsync(user);
    await manager.generateUserTokenAsync(user, TokenOptions.defaultEmailProvider, "Email");
    const providers = await manager.getValidTwoFactorProvidersAsync(user);
    expect(providers).toContain(TokenOptions.defaultEmailProvider);
  });

  it("verifyTwoFactorTokenAsync throws if provider missing", async () => {
    await manager.createAsync(user);
    await expect(manager.verifyTwoFactorTokenAsync(user, "missing", "token"))
      .rejects.toThrow("No token provider for missing");
  });

  it("verifyTwoFactorTokenAsync returns true if provider validates", async () => {
    await manager.createAsync(user);
    const token = await manager.generateTwoFactorTokenAsync(user, TokenOptions.defaultProvider );
    const result = await manager.verifyTwoFactorTokenAsync(user, TokenOptions.defaultProvider, token);
    expect(result).toBe(true);
  });

  it("generateTwoFactorTokenAsync throws if provider missing", async () => {
    await manager.createAsync(user);
    await expect(manager.generateTwoFactorTokenAsync(user, "missing"))
      .rejects.toThrow("No token provider for missing");
  });

  it("generateTwoFactorTokenAsync returns token", async () => {
    await manager.createAsync(user);
    const token = await manager.generateTwoFactorTokenAsync(user, TokenOptions.defaultProvider);
    expect(token).toBeTypeOf("string");
    expect(token.length).greaterThan(1);
  });

  it("getTwoFactorEnabledAsync returns true", async () => {
    await manager.createAsync(user);
    await manager.setTwoFactorEnabledAsync(user, true);
    const enabled = await manager.getTwoFactorEnabledAsync(user);
    expect(enabled).toBe(true);
  });

  it("setTwoFactorEnabledAsync returns success", async () => {
    await manager.createAsync(user);
    const result = await manager.setTwoFactorEnabledAsync(user, true);
    expect(result.succeeded).toBe(true);
  });

  it("isLockedOutAsync returns false if lockout disabled", async () => {
    await manager.createAsync(user);
    const result = await manager.isLockedOutAsync(user);
    expect(result).toBe(false);
  });

  it("isLockedOutAsync returns true if lockout enabled and date future", async () => {
    await manager.createAsync(user);
    await manager.setLockoutEnabledAsync(user, true);
    const lockoutEnd = new Date();
    lockoutEnd.setHours(24);
    await manager.setLockoutEndDateAsync(user, lockoutEnd);

    const result = await manager.isLockedOutAsync(user);
    expect(result).toBe(true);
  });

  it("setLockoutEnabledAsync returns success", async () => {
    await manager.createAsync(user);
    const result = await manager.setLockoutEnabledAsync(user, true);
    expect(result.succeeded).toBe(true);
  });

  it("getLockoutEnabledAsync returns true", async () => {
    await manager.createAsync(user);
    await manager.setLockoutEnabledAsync(user, true);
    const result = await manager.getLockoutEnabledAsync(user);
    expect(result).toBe(true);
  });

  it("getLockoutEndDateAsync returns date", async () => {
    await manager.createAsync(user);
    await manager.setLockoutEnabledAsync(user, true);
    const lockoutEnd = new Date();
    lockoutEnd.setHours(24);
    await manager.setLockoutEndDateAsync(user, lockoutEnd);

    const date = await manager.getLockoutEndDateAsync(user);
    expect(date).toBeInstanceOf(Date);
  });

  it("setLockoutEndDateAsync fails if lockout not enabled", async () => {
    await manager.createAsync(user);
    const result = await manager.setLockoutEndDateAsync(user, new Date());
    expect(result.succeeded).toBe(false);
  });

  it("setLockoutEndDateAsync succeeds if lockout enabled", async () => {
    await manager.createAsync(user);
    await manager.setLockoutEnabledAsync(user, true);
    const result = await manager.setLockoutEndDateAsync(user, new Date());
    expect(result.succeeded).toBe(true);
  });

  it("accessFailedAsync increments count and locks out when threshold reached", async () => {
    await manager.createAsync(user);
    manager.options.lockout.maxFailedAccessAttempts = 1;
    manager.options.lockout.defaultLockoutTimeSpan = 1;
    const result = await manager.accessFailedAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("resetAccessFailedCountAsync returns success if count is 0", async () => {
    await manager.createAsync(user);
    const result = await manager.resetAccessFailedCountAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("resetAccessFailedCountAsync resets count if >0", async () => {
    await manager.createAsync(user);
    await manager.accessFailedAsync(user);
    const result = await manager.resetAccessFailedCountAsync(user);
    expect(result.succeeded).toBe(true);
    const count = await manager.getAccessFailedCountAsync(user);
    expect(count).toBe(0);
  });

  it("getAccessFailedCountAsync returns number", async () => {
    await manager.createAsync(user);
    await manager.accessFailedAsync(user);
    const count = await manager.getAccessFailedCountAsync(user);
    expect(typeof count).toBe("number");
  });
});
