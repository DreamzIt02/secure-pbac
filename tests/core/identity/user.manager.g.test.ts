import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
import { IdentityErrorDescriber, UserManager } from "../../../src/core/identity/index.js";
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

describe("UserManager email & phone methods", () => {
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

  it("getEmailAsync returns email", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const email = await manager.getEmailAsync(user);
    expect(email).toBe("test@example.com");
  });

  it("setEmailAsync sets email and returns success", async () => {
    await manager.createAsync(user)
    const result = await manager.setEmailAsync(user, "new@example.com");
    expect(result.succeeded).toBe(true);
  });

  it("findByEmailAsync normalizes and finds user", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const found = await manager.findByEmailAsync("test@example.com");
    expect(found).toBe(user);
  });

  it("generateEmailConfirmationTokenAsync returns string", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const token = await manager.generateEmailConfirmationTokenAsync(user);
    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(1);
  });

  it("confirmEmailAsync fails if token invalid", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const result = await manager.confirmEmailAsync(user, "badtoken");
    expect(result.succeeded).toBe(false);
  });

  it("confirmEmailAsync succeeds if token valid", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const token = await manager.generateEmailConfirmationTokenAsync(user);
    const result = await manager.confirmEmailAsync(user, token);
    expect(result.succeeded).toBe(true);
  });

  it("isEmailConfirmedAsync returns true", async () => {
    user.email = "test@example.com";
    user.emailConfirmed = true;
    await manager.createAsync(user);
    const confirmed = await manager.isEmailConfirmedAsync(user);
    expect(confirmed).toBe(true);
  });

  it("generateChangeEmailTokenAsync returns string", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const token = await manager.generateChangeEmailTokenAsync(user, "new@example.com");
    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(1);
  });

  it("changeEmailAsync fails if token invalid", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const result = await manager.changeEmailAsync(user, "new@example.com", "badtoken");
    expect(result.succeeded).toBe(false);
  });

  it("changeEmailAsync succeeds if token valid", async () => {
    user.email = "test@example.com";
    await manager.createAsync(user);
    const token = await manager.generateChangeEmailTokenAsync(user, "new@example.com");
    const result = await manager.changeEmailAsync(user, "new@example.com", token);
    expect(result.succeeded).toBe(true);
  });

  it("getPhoneNumberAsync returns number", async () => {
    user.phoneNumber = "123456";
    await manager.createAsync(user);
    const phone = await manager.getPhoneNumberAsync(user);
    expect(phone).toBe("123456");
  });

  it("setPhoneNumberAsync sets number and returns success", async () => {
    await manager.createAsync(user);
    const result = await manager.setPhoneNumberAsync(user, "987654");
    expect(result.succeeded).toBe(true);
  });

  it("changePhoneNumberAsync fails if token invalid", async () => {
    user.phoneNumber = "123456";
    await manager.createAsync(user);
    const result = await manager.changePhoneNumberAsync(user, "987654", "badtoken");
    expect(result.succeeded).toBe(false);
  });

  it("changePhoneNumberAsync succeeds if token valid", async () => {
    user.phoneNumber = "123456";
    await manager.createAsync(user);
    const token = await manager.generateChangePhoneNumberTokenAsync(user, "987654");
    const result = await manager.changePhoneNumberAsync(user, "987654", token);
    expect(result.succeeded).toBe(true);
  });

  it("isPhoneNumberConfirmedAsync returns true", async () => {
    user.phoneNumber = "123456";
    user.phoneNumberConfirmed = true;
    await manager.createAsync(user);
    const confirmed = await manager.isPhoneNumberConfirmedAsync(user);
    expect(confirmed).toBe(true);
  });

  it("generateChangePhoneNumberTokenAsync returns string", async () => {
    user.phoneNumber = "123456";
    await manager.createAsync(user);
    const token = await manager.generateChangePhoneNumberTokenAsync(user, "987654");
    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(1);
  });

  it("verifyChangePhoneNumberTokenAsync returns true/false", async () => {
    user.phoneNumber = "123456";
    await manager.createAsync(user);
    const token = await manager.generateChangePhoneNumberTokenAsync(user, "987654");
    const valid = await manager.verifyChangePhoneNumberTokenAsync(user, token, "987654");
    expect(valid).toBe(true);
  });

  it("verifyUserTokenAsync throws if provider missing", async () => {
    await manager.createAsync(user);
    await expect(manager.verifyUserTokenAsync(user, "missing", "purpose", "token"))
      .rejects.toThrow("No token provider for missing");
  });

  it("generateUserTokenAsync throws if provider missing", async () => {
    await manager.createAsync(user);
    await expect(manager.generateUserTokenAsync(user, "missing", "purpose"))
      .rejects.toThrow("No token provider for missing");
  });

  it("registerTokenProvider registers provider", async () => {
    await manager.createAsync(user);
    const provider = { generateAsync: async () => "token", validateAsync: async () => true };
    manager.registerTokenProvider("custom", provider as any);
    const token = await manager.generateUserTokenAsync(user, "custom", "purpose");
    expect(token).toBe("token");
  });
});
