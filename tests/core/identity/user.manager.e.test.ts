import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { Claim } from "../../../src/claims/index.js";
import { IdentityErrorDescriber, UserManager } from "../../../src/core/identity/index.js";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
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

describe("UserManager claim methods", () => {
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

  it("addClaimAsync delegates to addClaimsAsync", async () => {
    const result = await manager.addClaimAsync(user, new Claim("t", "v"));
    expect(result.succeeded).toBe(true);
  });

  it("addClaimsAsync calls claim store", async () => {
    const result = await manager.addClaimsAsync(user, [new Claim("t", "v")]);
    expect(result.succeeded).toBe(true);
  });

  it("replaceClaimAsync calls claim store", async () => {
    const result = await manager.replaceClaimAsync(user, new Claim("t", "v"), new Claim("t2", "v2"));
    expect(result.succeeded).toBe(true);
  });

  it("removeClaimAsync delegates to removeClaimsAsync", async () => {
    const result = await manager.removeClaimAsync(user, new Claim("t", "v"));
    expect(result.succeeded).toBe(true);
  });

  it("removeClaimsAsync calls claim store", async () => {
    const result = await manager.removeClaimsAsync(user, [new Claim("t", "v")]);
    expect(result.succeeded).toBe(true);
  });

  it("getClaimsAsync returns claims", async () => {
    await manager.addClaimAsync(user, new Claim("type", "v"));
    await manager.addClaimAsync(user, new Claim("type1", "v1"));

    const claims = await manager.getClaimsAsync(user);
    expect(claims[0]).toBeInstanceOf(Claim);
    expect(claims[0].type).toBe("type");
  });
});
