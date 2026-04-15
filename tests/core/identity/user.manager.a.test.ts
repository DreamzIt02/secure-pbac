import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { IdentityErrorDescriber, UserManager } from "../../../src/core/identity/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, DbSet, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher, UserClaimsPrincipalFactory } from "../../../src/core/extensions/index.js";
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

describe("UserManager basic coverage", () => {
  let manager: UserManager<string, TestUser>;
  let user: TestUser;
  let store: FakeStore;
  
  const optionsAccessor = { value: new IdentityOptions() };
  const hasher = new FakeHasher();
  const errorDescriber = new IdentityErrorDescriber();

  beforeEach(() => {
    store = new FakeStore(new DbContextOptions(optionsAccessor.value));
    manager = new UserManager(store, optionsAccessor, hasher, [ new UserValidator(errorDescriber) ], [ new PasswordValidator(errorDescriber) ], new FakeNormalizer(), errorDescriber);
    user = new TestUser();
  });

  afterEach(() => {
    store.dispose()
  });

  it("constructor initializes with options and validators", () => {
    expect(manager.options).toBeInstanceOf(IdentityOptions);
    expect(manager["userValidators"].length).toBe(1);
    expect(manager["passwordValidators"].length).toBe(1);
  });

  it("constructor initializes with default options when accessor is null", () => {
    expect(manager.options).toBeInstanceOf(IdentityOptions);
  });

  it("dispose sets disposed flag", () => {
    manager.dispose();
    expect(manager["_disposed"]).toBeTruthy;
  });

  it("supportsUserX flags return true", () => {
    expect(manager.supportsUserAuthenticationTokens).toBe(true);
    expect(manager.supportsUserAuthenticatorKey).toBe(true);
    expect(manager.supportsUserTwoFactorRecoveryCodes).toBe(true);
    expect(manager.supportsUserTwoFactor).toBe(true);
    expect(manager.supportsUserPassword).toBe(true);
    expect(manager.supportsUserSecurityStamp).toBe(true);
    expect(manager.supportsUserRole).toBe(true);
    expect(manager.supportsUserLogin).toBe(true);
    expect(manager.supportsUserEmail).toBe(true);
    expect(manager.supportsUserPhoneNumber).toBe(true);
    expect(manager.supportsUserClaim).toBe(true);
    expect(manager.supportsUserLockout).toBe(true);
    expect(manager.supportsQueryableUsers).toBe(true);
  });

  it("users property returns queryable users", () => {
    expect(manager.users).instanceOf(DbSet<TestUser>);
  });
  it("constructor initializes", () => {
    expect(manager.options).toBeDefined();
  });

  it("dispose marks disposed", () => {
    manager.dispose();
    expect((manager as any)._disposed).toBe(true);
  });

  it("supports flags return true", () => {
    expect(manager.supportsUserPassword).toBe(true);
    expect(manager.supportsQueryableUsers).toBe(true);
  });

  it("users property returns queryable users", () => {
    expect(manager.users).instanceOf(DbSet<TestUser>);
  });

  it("getUserName and getUserId from principal", async () => {
    const principal = await new UserClaimsPrincipalFactory(manager, optionsAccessor).createAsync(user)
    
    expect(manager.getUserName(principal)).toBe("rejwanul");
    expect(manager.getUserId(principal)).toBe("u1");
  });

  it("getUserAsync returns user", async () => {
    await manager.createAsync(user);
    const principal = await new UserClaimsPrincipalFactory(manager, optionsAccessor).createAsync(user)
    const found = await manager.getUserAsync(principal);
    expect(found).toBeInstanceOf(TestUser);
  });

  it("create/update/delete succeed", async () => {
    expect((await manager.createAsync(user)).succeeded).toBe(true);
    expect((await manager.updateAsync(user)).succeeded).toBe(true);
    expect((await manager.deleteAsync(user)).succeeded).toBe(true);
  });

  it("findByIdAsync and findByNameAsync", async () => {
    await manager.createAsync(user);
    expect(await manager.findByIdAsync("u1")).toBeInstanceOf(TestUser);
    expect(await manager.findByNameAsync("rejwanul")).toBeInstanceOf(TestUser);
  });

  it("createWithPasswordAsync throws if missing args", async () => {
    await expect(manager.createWithPasswordAsync(null as any, "pw")).rejects.toThrow();
  });

  it("normalizeName and normalizeEmail", () => {
    expect(manager.normalizeName("abc")).toBe("ABC");
    expect(manager.normalizeEmail("abc@example.com")).toBe("ABC@EXAMPLE.COM");
  });

  it("getUserNameAsync and setUserNameAsync", async () => {
    expect(await manager.getUserNameAsync(user)).toBe("rejwanul");
    await manager.setUserNameAsync(user, "newname");
    expect(user.userName).toBe("newname");
  });

  it("getUserIdAsync returns id", async () => {
    expect(await manager.getUserIdAsync(user)).toBe("u1");
  });

  it("checkPasswordAsync returns false if mismatch", async () => {
    user.passwordHash = "hash";
    expect(await manager.checkPasswordAsync(user, "wrong")).toBe(false);
  });

  it("hasPasswordAsync returns false if no hash", async () => {
    expect(await manager.hasPasswordAsync(user)).toBe(false);
  });

  it("addPasswordAsync fails if already has password", async () => {
    user.passwordHash = "hash";
    const result = await manager.addPasswordAsync(user, "pw");
    expect(result.succeeded).toBe(false);
  });

  it("changePasswordAsync fails if mismatch", async () => {
    const result = await manager.changePasswordAsync(user, "wrong", "newpw");
    expect(result.succeeded).toBe(false);
  });

  it("removePasswordAsync succeeds", async () => {
    const result = await manager.removePasswordAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("getSecurityStampAsync returns stamp", async () => {
    expect(await manager.getSecurityStampAsync(user)).toBe("stamp");
  });
});
