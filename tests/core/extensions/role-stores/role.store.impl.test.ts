import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole, IdentityRoleClaim, IdentityUser } from "../../../../src/core/types/index.js";
import { RoleStore } from "../../../../src/core/extensions/role-stores/index.js";
import { IdentityErrorDescriber } from "../../../../src/core/identity/index.js";
import { Claim } from "../../../../src/claims/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../../src/contexts/index.js";
import { InMemoryContext } from "../../../../src/core/contexts/index.js";

class TestRole extends IdentityRole<string> {
  constructor() {
    super();
    this.id = "r1";
    this.name = "admin";
  }
}

class FakeContext extends InMemoryContext<IdentityUser<string>, TestRole, string> {
  constructor();
  constructor(options: DbContextOptions);
  constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }
  protected override onModelCreating(): void {
    super.onModelCreating(new ModelBuilder());
    // Override 
    this.users = this.register(IdentityUser<string>, new PrimaryKey({ id: "string" }, { auto: false }));
    this.roles = this.register(TestRole, new PrimaryKey({ id: "string" }, { auto: false }));
  }
}

describe("RoleStore", () => {
  let ctx: FakeContext;
  let store: RoleStore<TestRole, string, FakeContext>;
  let role: TestRole;

  beforeEach(() => {
    ctx = new FakeContext();
    store = new RoleStore<TestRole, string, FakeContext>(ctx, new IdentityErrorDescriber());
    role = new TestRole();
  });

  it("createAsync adds role", async () => {
    const result = await store.createAsync(role);
    expect(result.succeeded).toBe(true);
    expect(ctx.roles.toArray()).toContain(role);
  });

  it("updateAsync updates role", async () => {
    ctx.roles.add(role);
    const result = await store.updateAsync(role);
    expect(result.succeeded).toBe(true);
    expect(role.concurrencyStamp).toBeDefined();
  });

  it("deleteAsync removes role", async () => {
    ctx.roles.add(role);
    const result = await store.deleteAsync(role);
    expect(result.succeeded).toBe(true);
    expect(ctx.roles.toArray()).not.toContain(role);
  });

  it("getRoleIdAsync returns id", async () => {
    const id = await store.getRoleIdAsync(role);
    expect(id).toBe("r1");
  });

  it("getRoleNameAsync returns name", async () => {
    const name = await store.getRoleNameAsync(role);
    expect(name).toBe("admin");
  });

  it("setRoleNameAsync sets name", async () => {
    await store.setRoleNameAsync(role, "editor");
    expect(role.name).toBe("editor");
  });

  it("convertIdFromString returns typed key", () => {
    const id = store.convertIdFromString<string>("abc");
    expect(id).toBe("abc");
  });

  it("convertIdToString returns string", () => {
    const str = store.convertIdToString("xyz");
    expect(str).toBe("xyz");
  });

  it("findByIdAsync finds role", async () => {
    ctx.roles.add(role);
    const found = await store.findByIdAsync("r1");
    expect(found).toBe(role);
  });

  it("findByNameAsync finds role by normalizedName", async () => {
    ctx.roles.add(role);
    const found = await store.findByNameAsync("ADMIN");
    expect(found).toBe(role);
  });

  it("getNormalizedRoleNameAsync returns normalizedName", async () => {
    const norm = await store.getNormalizedRoleNameAsync(role);
    expect(norm).toBe("ADMIN");
  });

  it("setNormalizedRoleNameAsync does not throw", async () => {
    await expect(store.setNormalizedRoleNameAsync(role, "ADMIN")).resolves.toBeUndefined();
  });

  it("getClaimsAsync returns claims", async () => {
    const rc = new IdentityRoleClaim<string>();
    rc.roleId = "r1";
    rc.claimType = "perm";
    rc.claimValue = "read";
    ctx.roleClaims.add(rc);
    const claims = await store.getClaimsAsync(role);
    expect(claims[0]).toBeInstanceOf(Claim);
    expect(claims[0].type).toBe("perm");
  });

  it("addClaimAsync adds claim", async () => {
    await store.addClaimAsync(role, new Claim("perm", "write"));
    expect(ctx.roleClaims.toArray()[0].claimType).toBe("perm");
  });

  it("removeClaimAsync removes claim", async () => {
    const rc = new IdentityRoleClaim<string>();
    rc.roleId = "r1";
    rc.claimType = "perm";
    rc.claimValue = "read";
    ctx.roleClaims.add(rc);
    await store.removeClaimAsync(role, new Claim("perm", "read"));
    expect(ctx.roleClaims.toArray()).toHaveLength(0);
  });
});
