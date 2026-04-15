import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
import { IdentityErrorDescriber, IdentityResult, UserManager } from "../../../src/core/identity/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
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

describe("UserManager internal helpers & validation", () => {
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
  
  it("utcNow returns Date", () => {
    const now = (manager as any).utcNow();
    expect(now).toBeInstanceOf(Date);
  });

  it("getUserTwoFactorStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getUserTwoFactorStore()).toThrow("Store does not implement IUserTwoFactorStore");
  });

  it("getUserLockoutStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getUserLockoutStore()).toThrow("Store does not implement IUserLockoutStore");
  });

  it("getEmailStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getEmailStore()).toThrow("Store does not implement IUserEmailStore");
  });

  it("getOptionalEmailStore returns null if not implemented", () => {
    (manager as any).store = {};
    const result = (manager as any).getOptionalEmailStore();
    expect(result).toBeNull();
  });

  it("getPhoneNumberStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getPhoneNumberStore()).toThrow("Store does not implement IUserPhoneNumberStore");
  });

  it("createSecurityTokenAsync returns Uint8Array", async () => {
    const token = await manager.createSecurityTokenAsync(user);
    expect(token).toBeInstanceOf(Uint8Array);
  });

  it("updatePasswordHash succeeds with valid password", async () => {
    (manager as any).validatePasswordAsync = async () => IdentityResult.success();
    const result = await (manager as any).updatePasswordHash(user, "pw", true);
    expect(result.succeeded).toBe(true);
  });

  it("updatePasswordHash fails if validation fails", async () => {
    (manager as any).validatePasswordAsync = async () => IdentityResult.failed([]);
    const result = await (manager as any).updatePasswordHash(user, "pw", true);
    expect(result.succeeded).toBe(false);
  });

  it("getUserRoleStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getUserRoleStore()).toThrow("Store does not implement IUserRoleStore");
  });

  it("newSecurityStamp returns string", () => {
    const stamp = (UserManager as any).newSecurityStamp();
    expect(typeof stamp).toBe("string");
  });

  it("getLoginStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getLoginStore()).toThrow("Store does not implement IUserLoginStore");
  });

  it("getSecurityStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getSecurityStore()).toThrow("Store does not implement IUserSecurityStampStore");
  });

  it("getClaimStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => (manager as any).getClaimStore()).toThrow("Store does not implement IUserClaimStore");
  });

  it("getChangeEmailTokenPurpose returns string", () => {
    const purpose = UserManager.getChangeEmailTokenPurpose("abc@example.com");
    expect(purpose).toBe("ChangeEmail:abc@example.com");
  });

  it("validateUserAsync returns success if no errors", async () => {
    const result = await (manager as any).validateUserAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("validateUserAsync returns failed if validator fails", async () => {
    (manager as any).userValidators = [{
      validateAsync: async () => IdentityResult.failed([{ code: "err", description: "bad" }])
    }];
    const result = await (manager as any).validateUserAsync(user);
    expect(result.succeeded).toBe(false);
  });

  it("validatePasswordAsync returns success if no errors", async () => {
    const result = await (manager as any).validatePasswordAsync(user, "Password@123");
    expect(result.succeeded).toBe(true);
  });

  it("validatePasswordAsync returns failed if validator fails", async () => {
    (manager as any).passwordValidators = [{
      validateAsync: async () => IdentityResult.failed([{ code: "err", description: "bad" }])
    }];
    const result = await (manager as any).validatePasswordAsync(user, "pw");
    expect(result.succeeded).toBe(false);
  });

  it("updateUserAsync returns failed if validation fails", async () => {
    (manager as any).validateUserAsync = async () => IdentityResult.failed([{ code: "err", description: "bad" }]);
    const result = await (manager as any).updateUserAsync(user);
    expect(result.succeeded).toBe(false);
  });

  it("updateUserAsync returns success if validation passes", async () => {
    (manager as any).validateUserAsync = async () => IdentityResult.success();
    const result = await (manager as any).updateUserAsync(user);
    expect(result.succeeded).toBe(true);
  });

  it("throwIfDisposed throws if disposed", () => {
    (manager as any)._disposed = true;
    expect(() => (manager as any).throwIfDisposed()).toThrow("Object disposed");
  });

  it("getAuthenticatorKeyStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => {
      (manager as any).getAuthenticatorKeyStore();
    }).toThrow("Store does not implement IUserAuthenticatorKeyStore");
  });

  it("getRecoveryCodeStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => {
      (manager as any).getRecoveryCodeStore();
    }).toThrow("Store does not implement IUserTwoFactorRecoveryCodeStore");
  });

  it("getAuthenticationTokenStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => {
      (manager as any).getAuthenticationTokenStore();
    }).toThrow("Store does not implement IUserAuthenticationTokenStore");
  });

  it("getPasswordStore throws if not implemented", () => {
    (manager as any).store = {};
    expect(() => {
      (manager as any).getPasswordStore();
    }).toThrow("Store does not implement IUserPasswordStore");
  });


});
