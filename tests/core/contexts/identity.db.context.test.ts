import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole, IdentityRoleClaim, IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserRole, IdentityUserToken } from "../../../src/core/types/index.js";
import { IdentityDbContext } from "../../../src/core/contexts/index.js";
import { IdentityOptions, StoreOptions, Version } from "../../../src/core/options/index.js";
import { DbContextOptions } from "../../../src/contexts/index.js";

class TestUser extends IdentityUser<string> {}
class TestRole extends IdentityRole<string> {}
class TestUserClaim extends IdentityUserClaim<string> {}
class TestUserLogin extends IdentityUserLogin<string> {}
class TestUserToken extends IdentityUserToken<string> {}
class TestUserRole extends IdentityUserRole<string> {}
class TestRoleClaim extends IdentityRoleClaim<string> {}

describe("IdentityDbContext", () => {
  let ctx: IdentityDbContext<TestUser, TestRole, string, TestUserRole, TestUserClaim, TestUserLogin, TestUserToken, TestRoleClaim>;

  beforeEach(() => {
    ctx = new (class extends IdentityDbContext<TestUser, TestRole, string, TestUserRole, TestUserClaim, TestUserLogin, TestUserToken, TestRoleClaim> {
        protected override getStoreOptions() {
            const identityOptions = new IdentityOptions();
            const storeOptions = new StoreOptions();
            storeOptions.schemaVersion = new Version(3, 0);
            identityOptions.stores = storeOptions;
            return identityOptions.stores;
        }
    })(new DbContextOptions());
  });

  it("constructs with options", () => {
    expect(ctx).toBeInstanceOf(IdentityDbContext);
  });

  it("constructs with no options", () => {
    const ctx2 = new (class extends IdentityDbContext<TestUser, TestRole, string, TestUserRole, TestUserClaim, TestUserLogin, TestUserToken, TestRoleClaim> {} )();
    expect(ctx2).toBeInstanceOf(IdentityDbContext);
  });

  it("onModelCreatingVersion3 registers roles, userRoles, roleClaims", () => {
    ctx["onModelCreatingVersion3"]({} as any);
    expect(ctx.roles).toBeDefined();
    expect(ctx.userRoles).toBeDefined();
    expect(ctx.roleClaims).toBeDefined();
  });

  it("onModelCreatingVersion2 registers roles, userRoles, roleClaims", () => {
    ctx["onModelCreatingVersion2"]({} as any);
    expect(ctx.roles).toBeDefined();
    expect(ctx.userRoles).toBeDefined();
    expect(ctx.roleClaims).toBeDefined();
  });

  it("onModelCreatingVersion1 registers roles, userRoles, roleClaims", () => {
    ctx["onModelCreatingVersion1"]({} as any);
    expect(ctx.roles).toBeDefined();
    expect(ctx.userRoles).toBeDefined();
    expect(ctx.roleClaims).toBeDefined();
  });

  it("userRoles DbSet can add entity", () => {
    ctx["onModelCreatingVersion3"]({} as any);
    const role = new TestUserRole();
    role.userId = "u1";
    role.roleId = "r1";
    ctx.userRoles.add(role);
    expect(ctx.userRoles).toBeDefined();
  });

  it("roles DbSet can add entity", () => {
    ctx["onModelCreatingVersion3"]({} as any);
    const role = new TestRole();
    role.id = "r1";
    ctx.roles.add(role);
    expect(ctx.roles).toBeDefined();
  });

  it("roleClaims DbSet can add entity", () => {
    ctx["onModelCreatingVersion3"]({} as any);
    const claim = new TestRoleClaim();
    claim.roleId = "r1";
    claim.claimType = "perm";
    ctx.roleClaims.add(claim);
    expect(ctx.roleClaims).toBeDefined();
  });
});
