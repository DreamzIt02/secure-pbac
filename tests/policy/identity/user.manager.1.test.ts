import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { UserManager1 } from "../../../src/policy/identity/index.js";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { IdentityError, IdentityErrorDescriber, IdentityResult } from "../../../src/core/identity/index.js";
import { AuthorizeClaimEnum, AuthorizeClaimPriorityEnum, AuthorizeClaimTypeEnum, Claim, ClaimsPrincipal, SiteClaim } from "../../../src/claims/index.js";
import { SiteManager } from "../../../src/policy/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher, UserClaimsPrincipalFactory } from "../../../src/core/extensions/index.js";
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

describe("UserManager1 custom claim methods", () => {
  let manager: UserManager1<string, TestUser>;
  let user: TestUser;
  let store: FakeStore;

  const optionsAccessor = { value: new IdentityOptions() };
  const hasher = new FakeHasher();
  const errorDescriber = new IdentityErrorDescriber();

  beforeEach(() => {
    store = new FakeStore(new DbContextOptions(optionsAccessor.value));
    manager = new UserManager1(
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

  it("hasClaimAsync returns false if no user", async () => {
    const result = await manager.hasClaimAsync(null as any, new Claim("t", "v"));
    expect(result).toBe(false);
    });

    it("hasClaimAsync returns true if claim exists", async () => {
    await manager.createAsync(user);
    await manager.addClaimAsync(user, new Claim("t", "v"));
    const result = await manager.hasClaimAsync(user, new Claim("t", "v"));
    expect(result).toBe(true);
    });

    it("hasSignInClaimAsync returns false if user is null", async () => {
    const principal = new ClaimsPrincipal([]);
    // Simulate getUserAsync returning null by not creating the user
    const result = await manager.hasSignInClaimAsync(principal);
    expect(result).toBe(false);
    });

    it("hasSignInClaimAsync returns false if no claim", async () => {
    await manager.createAsync(user);
    const principal = new ClaimsPrincipal([]);
    const result = await manager.hasSignInClaimAsync(principal);
    expect(result).toBe(false);
    });

    it("hasSignInClaimAsync returns true if claim matches", async () => {
    await manager.createAsync(user);
    await manager.addClaimAsync(user, SiteClaim.newSignInClaim());
    const principal = await new UserClaimsPrincipalFactory(manager, optionsAccessor).createAsync(user);
    const result = await manager.hasSignInClaimAsync(principal);
    expect(result).toBe(true);
    });

    it("addSignInClaimAsync returns failed if no user", async () => {
    const result = await manager.addSignInClaimAsync(null as any);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0]).toBeInstanceOf(IdentityError);
    });

    it("addSignInClaimAsync adds claim if missing", async () => {
    await manager.createAsync(user);
    const result = await manager.addSignInClaimAsync(user);
    expect(result.succeeded).toBe(true);
    });

    it("addSignInClaimAsync returns success if claim exists", async () => {
    await manager.createAsync(user);
    await manager.addClaimAsync(user, SiteClaim.newSignInClaim());
    const result = await manager.addSignInClaimAsync(user);
    expect(result.succeeded).toBe(true);
    });

    it("updateSignInClaimAsync returns failed if no user", async () => {
    const result = await manager.updateSignInClaimAsync(null as any);
    expect(result.succeeded).toBe(false);
    });

    it("updateSignInClaimAsync adds claim if missing", async () => {
    await manager.createAsync(user);
    const result = await manager.updateSignInClaimAsync(user);
    expect(result.succeeded).toBe(true);
    });

    it("updateSignInClaimAsync replaces claim if exists", async () => {
    await manager.createAsync(user);
    await manager.addClaimAsync(user, SiteClaim.newSignInClaim());
    const result = await manager.updateSignInClaimAsync(user);
    expect(result.succeeded).toBe(true);
    });

    it("getDepartmentAsync returns null if no claim", async () => {
    await manager.createAsync(user);
    const result = await manager.getDepartmentAsync(user);
    expect(result).toBeNull();
    });

    it("getDepartmentAsync returns parsed enum if claim exists", async () => {
    await manager.createAsync(user);
    const claimType = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    await manager.addClaimAsync(user, new Claim(claimType, "1"));
    const result = await manager.getDepartmentAsync(user);
    expect(Object.values(AuthorizeClaimEnum)).toContain(result);
    });

    it("getPriorityAsync returns 0 if claim not found", async () => {
    await manager.createAsync(user);
    const result = await manager.getPriorityAsync(user, AuthorizeClaimEnum.DepartmentAdministration);
    expect(result).toBe(0);
    });

    it("getPriorityAsync returns parsed value if claim found", async () => {
    await manager.createAsync(user);
    const claim = SiteManager.priorityClaim(AuthorizeClaimEnum.DepartmentUser, null);
    await manager.addClaimAsync(user, new Claim(claim.type, "5"));
    const result = await manager.getPriorityAsync(user, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(5);
    });

    it("priorManagerResolve categorizes users by claim", async () => {
    await manager.createAsync(user);
    const claimType = SiteManager.priorManagerClaimType(AuthorizeClaimEnum.DepartmentPost);
    await manager.addClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.A))));
    const result = await manager.priorManagerResolve(AuthorizeClaimEnum.DepartmentPost, [user]);
    expect(result.A).toContain(user);
    expect(result.Z).toContain(user);
    });

});
