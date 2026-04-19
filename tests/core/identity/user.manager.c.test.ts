import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser, UserLoginInfo } from "../../../src/core/types/index.js";
import { IdentityErrorDescriber, IdentityResult, UserManager } from "../../../src/core/identity/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
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
  constructor(id?: string, name?: string) {
    super(name);
    this.id = id ?? "";
  }
}

class FakeContext extends InMemoryContext<TestUser, TestRole, string> {
  constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }
  protected override onModelCreating(): void {
    super.onModelCreating(new ModelBuilder());
    this.users = this.register(TestUser, new PrimaryKey({ id: "string" }, { auto: false }));
    this.roles = this.register(TestRole, new PrimaryKey({ id: "string" }, { auto: false }));
  }
}

class FakeStore extends InMemoryUserStore<string, TestUser, TestRole, InMemoryContext<TestUser, TestRole, string>> {
  constructor(options: DbContextOptions) {
    super(FakeContext, TestUser, TestRole, options);
  }
}

class FakeHasher extends PasswordHasher<TestUser> {}
class FakeNormalizer extends LookupNormalizer {}

describe("UserManager login methods", () => {
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
      hasher,
      [new UserValidator(errorDescriber)],
      [new PasswordValidator(errorDescriber)],
      new FakeNormalizer(),
      errorDescriber,
      optionsAccessor,
    );
    user = new TestUser();
  });

  afterEach(() => {
    store.dispose()
  });

  it("users property returns users", () => {
    expect(manager.users).toBeInstanceOf(Object); // DbSet<TestUser> is an object
  });

  it("users property throws if store not queryable", () => {
    const badStore = { dispose() {} };
    const badManager = new UserManager(
      badStore as any,
      new FakeHasher() as any,
      [],
      [],
      new FakeNormalizer() as any,
      new IdentityErrorDescriber(),
      { value: {} } as any,
    );
    expect(badManager.users).toBeUndefined();
  });

  it("findByLoginAsync returns user when found", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "exists", "display");
    await manager.addLoginAsync(user, login);
    const found = await manager.findByLoginAsync("provider", "exists");
    expect(found).toBeInstanceOf(TestUser);
  });

  it("findByLoginAsync returns null when not found", async () => {
    const found = await manager.findByLoginAsync("provider", "missing");
    expect(found).toBeNull();
  });

  it("removeLoginAsync updates user and returns success", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "key", "display");
    await manager.addLoginAsync(user, login);
    const result = await manager.removeLoginAsync(user, "provider", "key");
    expect(result.succeeded).toBe(true);
  });

  it("addLoginAsync succeeds if no existing user", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "newkey", "display");
    const result = await manager.addLoginAsync(user, login);
    expect(result.succeeded).toBe(true);
  });

  it("getLoginsAsync returns logins", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "key", "display");
    await manager.addLoginAsync(user, login);
    const logins = await manager.getLoginsAsync(user);
    expect(logins[0]).toBeInstanceOf(UserLoginInfo);
  });

  it("addLoginAsync fails if existing user found", async () => {
    await manager.createAsync(user);
    const login = new UserLoginInfo("provider", "exists", "display");
    await manager.addLoginAsync(user, login);
    const result = await manager.addLoginAsync(user, login);
    expect(result.succeeded).toBe(false);
  });
});
