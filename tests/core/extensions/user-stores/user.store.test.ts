import { describe, it, expect, beforeEach } from "vitest";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../../src/contexts/index.js";
import { IdentityRole, IdentityUser, UserLoginInfo } from "../../../../src/core/types/index.js";
import { UserStore } from "../../../../src/core/extensions/user-stores/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { Claim } from "../../../../src/claims/index.js";
import { InMemoryContext } from "../../../../src/core/contexts/index.js";

class FakeContext extends InMemoryContext<IdentityUser<string>, IdentityRole<string>, string> {
  constructor();
  constructor(options: DbContextOptions);
  constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }
  protected override onModelCreating(): void {
    super.onModelCreating(new ModelBuilder());
    // Override 
    this.users = this.register(IdentityUser<string>, new PrimaryKey({ id: "string" }, { auto: false }));
    this.roles = this.register(IdentityRole<string>, new PrimaryKey({ id: "string" }, { auto: false }));
  }
}

// class FakeStore extends InMemoryUserStore<string, IdentityUser<string>, IdentityRole<string>, InMemoryContext<IdentityUser<string>, IdentityRole<string>, string>> {
//   constructor(options: DbContextOptions) {
//     super(FakeContext, IdentityUser, IdentityRole, options);
//   }
// }

describe("UserStore", () => {
  let ctx: FakeContext;
  let store: UserStore<
    IdentityUser<string>,
    IdentityRole<string>,
    string,
    FakeContext
  >;
  let user: IdentityUser<string>;
  let role: IdentityRole<string>;

  beforeEach(() => {
    ctx = new FakeContext();
    store = new UserStore(ctx, IdentityUser, IdentityRole);

    user = new IdentityUser<string>();
    user.id = "u1";
    user.userName = "alice";
    user.email = "alice@mail";
    ctx.add(user);

    role = new IdentityRole<string>();
    role.id = "r1";
    role.name = "ADMIN";
    ctx.add(role);
  });


  it("creates, updates, deletes user", async () => {
    const result = await store.createAsync(user, CancellationToken.none);
    expect(result.succeeded).toBe(true);

    user.concurrencyStamp = "old";
    const updateResult = await store.updateAsync(user, CancellationToken.none);
    expect(updateResult.succeeded).toBe(true);
    expect(user.concurrencyStamp).not.toBe("old");

    const deleteResult = await store.deleteAsync(user, CancellationToken.none);
    expect(deleteResult.succeeded).toBe(true);
  });

  it("finds user by id, name, email", async () => {
    expect(await store.findByIdAsync("u1")).toBe(user);
    expect(await store.findByNameAsync("ALICE")).toBe(user);
    expect(await store.findByEmailAsync("ALICE@MAIL")).toBe(user);
  });

  it("adds and removes role", async () => {
    await store.addToRoleAsync(user, "ADMIN", CancellationToken.none);
    const roles = await store.getRolesAsync(user, CancellationToken.none);
    expect(roles).toContain("ADMIN");
    expect(await store.isInRoleAsync(user, "ADMIN", CancellationToken.none)).toBe(true);

    await store.removeFromRoleAsync(user, "ADMIN", CancellationToken.none);
    expect(await store.isInRoleAsync(user, "ADMIN", CancellationToken.none)).toBe(false);
  });

  it("adds, replaces, removes claims", async () => {
    const claim = new Claim("type", "value");
    await store.addClaimsAsync(user, [claim], CancellationToken.none);
    let claims = await store.getClaimsAsync(user, CancellationToken.none);
    expect(claims.length).toBe(1);

    const newClaim = new Claim("type", "newValue");
    await store.replaceClaimAsync(user, claim, newClaim, CancellationToken.none);
    claims = await store.getClaimsAsync(user, CancellationToken.none);
    expect(claims[0].value).toBe("newValue");

    await store.removeClaimsAsync(user, [newClaim], CancellationToken.none);
    claims = await store.getClaimsAsync(user, CancellationToken.none);
    expect(claims.length).toBe(0);
  });

  it("gets users for claim", async () => {
    const claim = new Claim("type", "value");
    await store.addClaimsAsync(user, [claim], CancellationToken.none);
    const users = await store.getUsersForClaimAsync(claim, CancellationToken.none);
    expect(users[0]).toBe(user);
  });

  it("adds and removes login", async () => {
    const login = new UserLoginInfo("prov", "key", "disp");
    await store.addLoginAsync(user, login, CancellationToken.none);
    const logins = await store.getLoginsAsync(user, CancellationToken.none);
    expect(logins[0].providerKey).toBe("key");

    await store.removeLoginAsync(user, "prov", "key", CancellationToken.none);
    expect(await store.getLoginsAsync(user, CancellationToken.none)).toEqual([]);
  });

  it("adds and removes token", async () => {
    await store.setTokenAsync(user, "prov", "name", "val", CancellationToken.none);
    const val = await store.getTokenAsync(user, "prov", "name", CancellationToken.none);
    expect(val).toBe("val");

    await store.removeTokenAsync(user, "prov", "name", CancellationToken.none);
    const val2 = await store.getTokenAsync(user, "prov", "name", CancellationToken.none);
    expect(val2).toBeNull();
  });
});
