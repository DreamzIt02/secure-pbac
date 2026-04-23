
import { AsyncLocalStorage } from "node:async_hooks";
import {
  AllowedPrimaryKeysSafe,
  DbContextOptions,
  DbContextOptionsBuilder,
  ModelBuilder,
} from "../../contexts/index.js";
import {
  IdentityRole,
  IdentityRoleClaim,
  IdentityUser,
  IdentityUserClaim,
  IdentityUserLogin,
  IdentityUserRole,
  IdentityUserToken,
} from "../types/index.js";
import { IdentityDbContext } from "./identity.db.context.js";

/// <summary>
/// NodeDbContext: In‑memory identity DbContext using AsyncLocalStorage.
/// Provides EF‑style identity persistence without external DB.
/// </summary>
export class NodeDbContext<
  TUser extends IdentityUser<TKey>,
  TRole extends IdentityRole<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>
> extends IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim> {

  private static readonly storage = new AsyncLocalStorage<NodeDbContext<any, any, any>>();

  public static runWithContext<T>(options: DbContextOptions, fn: (ctx: NodeDbContext<any, any, any>) => T): T {
    const ctx = new NodeDbContext(options);
    return NodeDbContext.storage.run(ctx, () => fn(ctx));
  }

  public static get current(): NodeDbContext<any, any, any> | undefined {
    return NodeDbContext.storage.getStore();
  }

  public constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }

  protected override onConfiguring(builder?: DbContextOptionsBuilder): void {
    // No external DB provider — everything is in memory
    super.onConfiguring(builder);
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    super.onModelCreating(builder);
  }
}

// ### 🔑 Key Points
// - **AsyncLocalStorage**: Each request gets its own `NodeDbContext` instance, scoped via `runWithContext`. This mirrors ASP.NET Core’s `AsyncLocal<HttpContext>`.
// - **In‑memory persistence**: `builder.useInMemory()` ensures no external DB provider is required.
// - **Identity sets**: `roles`, `userRoles`, `roleClaims` are registered exactly like EF Core identity tables, but stored in memory.
// - **Access pattern**: Anywhere in your pipeline, you can call `NodeDbContext.current` to get the active context for the request.

// ### ✅ Usage Example
// ```ts
// NodeDbContext.runWithContext({}, async (ctx) => {
//   const role = ctx.roles.add(new IdentityRole("admin"));
//   const user = ctx.users.add(new IdentityUser("alice"));
//   ctx.userRoles.add(new IdentityUserRole(user.id, role.id));

//   console.log([...ctx.roles]); // in-memory roles
// });
// ```
