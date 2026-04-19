import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LookupNormalizer, PasswordHasher } from "../../../src/core/extensions/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { IdentityErrorDescriber, UserManager } from "../../../src/core/identity/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
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

describe("UserManager role methods", () => {
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

  it("addToRoleAsync succeeds when user not in role", async () => {
    const result = await manager.addToRoleAsync(user, "ADMIN");
    expect(result.succeeded).toBe(true);
  });

  it("addToRoleAsync fails when user already in role", async () => {
    user.userName = "ADMIN";
    await manager.addToRoleAsync(user, "ADMIN");
    const result = await manager.addToRoleAsync(user, "ADMIN");
    expect(result.succeeded).toBe(false);
  });

  it("addToRolesAsync succeeds for multiple roles", async () => {
    const result = await manager.addToRolesAsync(user, ["ADMIN", "MANAGER"]);
    expect(result.succeeded).toBe(true);
  });

  it("addToRolesAsync fails if already in one role", async () => {
    await manager.addToRoleAsync(user, "ADMIN");
    const result = await manager.addToRolesAsync(user, ["ADMIN", "MANAGER"]);
    expect(result.succeeded).toBe(false);
  });

  it("removeFromRoleAsync succeeds when user in role", async () => {
    await manager.addToRoleAsync(user, "ADMIN");
    const result = await manager.removeFromRoleAsync(user, "ADMIN");
    expect(result.succeeded).toBe(true);
  });

  it("removeFromRoleAsync fails when user not in role", async () => {
    const result = await manager.removeFromRoleAsync(user, "ADMIN");
    expect(result.succeeded).toBe(false);
  });

  it("removeFromRolesAsync succeeds for multiple roles", async () => {
    await manager.addToRolesAsync(user, ["ADMIN", "MANAGER"]);
    const result = await manager.removeFromRolesAsync(user, ["ADMIN", "MANAGER"]);
    expect(result.succeeded).toBe(true);
  });

  it("removeFromRolesAsync fails if not in one role", async () => {
    const result = await manager.removeFromRolesAsync(user, ["ADMIN"]);
    expect(result.succeeded).toBe(false);
  });

  it("getRolesAsync returns roles", async () => {
    await manager.addToRolesAsync(user, ["ADMIN", "MANAGER"]);
    const roles = await manager.getRolesAsync(user);
    expect(roles).toContain("ADMIN");
  });

  it("isInRoleAsync returns true/false correctly", async () => {
    await manager.addToRolesAsync(user, ["ADMIN"]);
    expect(await manager.isInRoleAsync(user, "ADMIN")).toBe(true);
    expect(await manager.isInRoleAsync(user, "MANAGER")).toBe(false);
  });
});
