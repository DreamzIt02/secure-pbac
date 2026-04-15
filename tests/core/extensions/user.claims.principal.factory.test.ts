import { describe, it, expect, beforeEach } from "vitest";
import { UserClaimsPrincipalFactory } from "../../../src/core/extensions/user.claims.principal.factory.js";
import { IdentityUser, IdentityRole, PasswordVerificationResult } from "../../../src/core/types/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { IOptions } from "../../../src/types/index.js";
import { IdentityErrorDescriber, IdentityResult, RoleManager, UserManager } from "../../../src/core/identity/index.js";
import { ILookupNormalizer, IPasswordHasher } from "../../../src/core/extensions/index.js";
import { IPasswordValidator, IRoleValidator, IUserValidator } from "../../../src/core/validators/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import { Claim } from "../../../src/claims/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { RoleStore } from "../../../src/core/extensions/role-stores/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";

// Simple test user and role
class TestUser extends IdentityUser<string> {
  constructor();
  constructor(id: string, userName: string, email?: string | null);
  constructor(id?: string, userName?: string, email?: string | null) {
    super(userName ?? "");
    this.id = id ?? "";
    this.userName = userName ?? "";
    this.email = email ?? null;
  }
}

class TestRole extends IdentityRole<string> {
  constructor();
  constructor(id: string, name: string);
  constructor(id?: string, name?: string) {
    super();
    this.id = id ?? "";
    this.name = name ?? "";
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

class FakeRoleStore extends RoleStore<TestRole, string, InMemoryContext<TestUser, TestRole, string>> {
  constructor(context: InMemoryContext<TestUser, TestRole, string>, describer?: IdentityErrorDescriber) {
    super(context, describer)
  }
}

const fakeHasher: IPasswordHasher<TestUser> = {
  hashPassword(user: TestUser, password: string): string {
    // simple stub: return a constant string
    return "hashed";
  },

  verifyHashedPassword(user: TestUser, hashedPassword: string, providedPassword: string): PasswordVerificationResult {
    // simple stub: always succeed
    return PasswordVerificationResult.Success;
  }
};

// ✅ Fake validator that always succeeds
const fakeUserValidators: IUserValidator<string, TestUser>[] = [
  {
    async validateAsync(manager, user): Promise<IdentityResult> {
      // simple stub: always return success
      return IdentityResult.success();
    }
  }
];

// ✅ Fake role validator that always succeeds
const fakeRoleValidators: IRoleValidator<string, TestRole>[] = [
  {
    async validateAsync(manager, role): Promise<IdentityResult> {
      // simple stub: always return success
      return IdentityResult.success();
    }
  }
];


// ✅ Fake password validator that always succeeds
const fakePasswordValidators: IPasswordValidator<string, TestUser>[] = [
  {
    async validateAsync(manager, user, password: string | null): Promise<IdentityResult> {
      // simple stub: always return success
      return IdentityResult.success();
    }
  }
];


// ✅ Fixed fakeNormalizer
const fakeNormalizer: ILookupNormalizer = {
  normalizeName(name: string | null): string | null {
    return name ? name.toUpperCase() : null;
  },
  normalizeEmail(email: string | null): string | null {
    return email ? email.toUpperCase() : null;
  }
};

const fakeErrors = new IdentityErrorDescriber();


describe("UserClaimsPrincipalFactory", () => {
  let userManager: UserManager<string, TestUser>;
  let roleManager: RoleManager<string, TestRole>;
  let options: IOptions<IdentityOptions>;
  let user: TestUser;
  let role: TestRole;

  const describer     = new IdentityErrorDescriber();
  const fakeStore     = new FakeStore(new DbContextOptions());
  const fakeRoleStore = new FakeRoleStore(fakeStore.getContext, describer);

  beforeEach(() => {
    const fakeOptions: IOptions<IdentityOptions> = { value: new IdentityOptions() };
    
    userManager = new UserManager<string, TestUser>(
        fakeStore,
        fakeOptions,
        fakeHasher,
        fakeUserValidators,
        fakePasswordValidators,
        fakeNormalizer,
        fakeErrors
    );
    roleManager = new RoleManager<string, TestRole>(fakeRoleStore, fakeRoleValidators, fakeNormalizer, fakeErrors);

    options = fakeOptions;
    user = new TestUser("u1", "testUser", "test@example.com");
    role = new TestRole("r1", "Role1");
  });

  it("creates principal with base claims", async () => {
    const factory = new UserClaimsPrincipalFactory(userManager, options);
    const principal = await factory.createAsync(user);
    const claims = principal.identity!.claims;
    expect(claims.some(c => c.type === factory.options.userIdClaimType)).toBe(true);
    expect(claims.some(c => c.type === factory.options.userNameClaimType)).toBe(true);
  });

  it("includes email and security stamp claims", async () => {
    const factory = new UserClaimsPrincipalFactory(userManager, options);
    const principal = await factory.createAsync(user);
    const claims = principal.identity!.claims;
    expect(claims.some(c => c.type === factory.options.emailClaimType)).toBe(true);
    expect(claims.some(c => c.type === factory.options.securityStampClaimType)).toBe(true);
  });

  it("includes custom user claims", async () => {
    await userManager.addClaimAsync(user, new Claim("custom", "custom_claim"))
    const factory = new UserClaimsPrincipalFactory(userManager, options);
    const principal = await factory.createAsync(user);
    expect(principal.identity!.claims.some(c => c.type === "custom")).toBe(true);
  });

  it("includes role claims when roleManager is provided", async () => {
    await roleManager.createAsync(role);
    await roleManager.addClaimAsync(role, new Claim("roleClaim", "roleClaim"));
    await userManager.addToRoleAsync(user, role.name!);

    const factory = new UserClaimsPrincipalFactory(userManager, roleManager, options);
    const principal = await factory.createAsync(user);
    expect(principal.identity!.claims.some(c => c.type === factory.options.roleClaimType)).toBe(true);
    expect(principal.identity!.claims.some(c => c.type === "roleClaim")).toBe(true);
  });

  it("throws if user is null", async () => {
    const factory = new UserClaimsPrincipalFactory(userManager, options);
    await expect(factory.createAsync(null as any)).rejects.toThrow();
  });

  it("throws if userManager is null", () => {
    expect(() => new UserClaimsPrincipalFactory(null as any, options)).toThrow();
  });

  it("throws if optionsAccessor is null", () => {
    expect(() => new UserClaimsPrincipalFactory(userManager, null as any)).toThrow();
  });
});
