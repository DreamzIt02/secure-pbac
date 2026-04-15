// tests/default.policy.authorization.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DefaultPolicyAuthorizationService } from "../../src/policy/index.js";
import { AuthorizeClaimEnum, Claim, ClaimsPrincipal, SiteClaim } from "../../src/claims/index.js";
import { AuthorizationResult } from "../../src/core/index.js";
import { PolicyEnum } from "../../src/policies/index.js";
import { IOptions } from "../../src/types/index.js";
import { IdentityOptions } from "../../src/core/options/index.js";
import { UserManager1 } from "../../src/policy/identity/index.js";
import { IdentityRole, IdentityUser } from "../../src/core/types/index.js";
import { IdentityErrorDescriber, RoleManager } from "../../src/core/identity/index.js";
import { InMemoryContext } from "../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../src/contexts/index.js";
import { InMemoryUserStore } from "../../src/core/extensions/user-stores/index.js";
import { LookupNormalizer, PasswordHasher } from "../../src/core/extensions/index.js";
import { PasswordValidator, RoleValidator, UserValidator } from "../../src/core/validators/index.js";
import { AuthorizeRoleEnum, SiteRole } from "../../src/roles/site.role.js";
import { RoleStore } from "../../src/core/extensions/role-stores/index.js";

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

class FakeRoleStore extends RoleStore<TestRole, string, InMemoryContext<TestUser, TestRole, string>> {
  constructor(context: InMemoryContext<TestUser, TestRole, string>, describer?: IdentityErrorDescriber) {
    super(context, describer)
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

describe("DefaultPolicyAuthorizationService", () => {
  let authService: any;
  let store: FakeStore;
  let roleStore: FakeRoleStore;
  let userManager: UserManager1<string, TestUser>;
  let roleManager: RoleManager<string, TestRole>;
  let options: IOptions<IdentityOptions>;
  let service: DefaultPolicyAuthorizationService<string, any, any>;
  let User: ClaimsPrincipal;
  let user: TestUser;

  const optionsAccessor = { value: new IdentityOptions() };
  const hasher = new FakeHasher();
  const errorDescriber = new IdentityErrorDescriber();
  const userValidators = [ new UserValidator(errorDescriber) ];
  const passwordValidators = [ new PasswordValidator(errorDescriber) ];
  const roleValidators = [ new RoleValidator(errorDescriber) ];
  const normalizer = new FakeNormalizer();

  beforeEach(() => {
    authService = { authorizeAsync: vi.fn().mockResolvedValue(AuthorizationResult.success()) };
    store = new FakeStore(new DbContextOptions(optionsAccessor.value));
    roleStore = new FakeRoleStore(store.getContext, errorDescriber);

    userManager = new UserManager1(store, hasher, userValidators, passwordValidators, normalizer, errorDescriber, optionsAccessor) as any;
    roleManager = new RoleManager(roleStore, roleValidators, normalizer, errorDescriber) as any;
    options = { value: new IdentityOptions() };
    service = new DefaultPolicyAuthorizationService(authService, userManager, roleManager, options);
    User = new ClaimsPrincipal([]);
    user = new TestUser();

    userManager.getUsersInRoleAsync = async (roleName: string): Promise<TestUser[]> => {
        return Promise.resolve([ user ])
    }
  });

  it("authorizeAsync should call authService for single policy", async () => {
    const result = await service.authorizeAsync(User, PolicyEnum.SiteAdmin);
    expect(authService.authorizeAsync).toHaveBeenCalled();
    expect(result.succeeded).toBe(true);
  });

  it("authorizeAsync should iterate policies array", async () => {
    const result = await service.authorizeAsync(User, [PolicyEnum.SiteGeneralAdmin, PolicyEnum.SiteAdmin]);
    expect(result.succeeded).toBe(true);
  });

  it("isDefaultAdmin should call authService", async () => {
    const result = await service.isDefaultAdmin(User);
    expect(result.succeeded).toBe(true);
  });

  it("isActingAdmin should call authService", async () => {
    const result = await service.isActingAdmin(User);
    expect(result.succeeded).toBe(true);
  });

  it("isGeneralAdmin should call authService", async () => {
    const result = await service.isGeneralAdmin(User);
    expect(result.succeeded).toBe(true);
  });

  it("isDepartmentAdmin should succeed when claim matches", async () => {
    User.hasClaim = () => true;
    const result = await service.isDepartmentAdmin(User);
    expect(result.succeeded).toBe(true);
  });

  it("isDepartmentManager should succeed when claim matches", async () => {
    User.hasClaim = () => true;
    const result = await service.isDepartmentManager(User);
    expect(result.succeeded).toBe(true);
  });

  it("isInAdminGroup should return true if role matches", async () => {
    User.isInRole = () => true;
    const result = await service.isInAdminGroup(User);
    expect(result).toBe(true);
  });

  it("forbiddenAdminGroup should chain admin checks", async () => {
    const result = await service.forbiddenAdminGroup(User);
    expect(result).toBe(true);
  });

  it("authorizeAdminGroup should chain admin checks", async () => {
    const result = await service.authorizeAdminGroup(User);
    expect(result).toBe(true);
  });

  it("authorizeManagerGroup should call isDepartmentManager", async () => {
    const result = await service.authorizeManagerGroup(User);
    expect(result).toBe(true);
  });

  it("getDefaultAdmin should return first user", async () => {
    const result = await service.getDefaultAdmin();
    expect(result).not.toBeNull();
  });

  it("getActingAdmin should return user if authorized", async () => {
    const result = await service.getActingAdmin();
    expect(result).not.toBeNull();
  });

  it("getGeneralAdmin should return user if authorized", async () => {
    const result = await service.getGeneralAdmin();
    expect(result).not.toBeNull();
  });

  it("getDepartmentAdmin should return user if authorized", async () => {
    const roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeDepartmentAdmin);
    await roleManager.createAsync(new TestRole("r1", roleName));

    await userManager.createAsync(user);
    await userManager.addClaimAsync(user, SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!);
    await userManager.addToRoleAsync(user, roleName);
    
    const result = await service.getDepartmentAdmin(AuthorizeClaimEnum.DepartmentUser);
    expect(result).not.toBeNull();
  });

  it("getDepartmentAdmins should return array of users", async () => {
    const result = await service.getDepartmentAdmins([AuthorizeClaimEnum.DepartmentUser]);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getDepartmentManagers should return array of users", async () => {
    const result = await service.getDepartmentManagers(AuthorizeClaimEnum.DepartmentUser);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getValidManager should return manager if valid", async () => {
    await userManager.createAsync(user);
    const result = await service.getValidManager({ manager: user.userName! });
    expect(result).not.toBeNull();
  });

  it("hasValidManager should return true if valid", async () => {
    await userManager.createAsync(user);
    const result = await service.hasValidManager({ manager: user.userName! });
    expect(result).toBe(true);
  });
});
