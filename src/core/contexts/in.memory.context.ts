
import { AllowedPrimaryKeysSafe, DbConnection, DbContext, DbContextOptions, DbContextOptionsBuilder } from "../../contexts/index.js";
import { IdentityRole, IdentityRoleClaim, IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserRole, IdentityUserToken } from "../types/index.js";
import { IdentityDbContext } from "./identity.db.context.js";

/// <summary>
/// In-memory context with full overload.
/// </summary>
export class InMemoryContext<
  TUser extends IdentityUser<TKey>,
  TRole extends IdentityRole<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
> extends IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim> {
  private readonly connection!: DbConnection;

  protected constructor();
  protected constructor(options: DbContextOptions);
  protected constructor(connection?: DbConnection, options?: DbContextOptions);
  protected constructor(arg1?: DbConnection | DbContextOptions, arg2?: DbContextOptions) {
    if (arg2 instanceof DbContextOptions)
      super(arg2);
    else if (arg1 instanceof DbContextOptions)
      super(arg1);
    else 
      super();

    if (arg1 instanceof DbConnection)
      this.connection = arg1
  }

  public static create<
    TUser extends IdentityUser<TKey>,
    TRole extends IdentityRole<TKey>,
    TKey  extends AllowedPrimaryKeysSafe,
    TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
    TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
    TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
    TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
    TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
  >(connection: DbConnection, options?: DbContextOptions): InMemoryContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim>;

  public static create<
    TUser extends IdentityUser<TKey>,
    TRole extends IdentityRole<TKey>,
    TKey  extends AllowedPrimaryKeysSafe,
    TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
    TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
    TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
    TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
    TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
    TContext   extends IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim> = IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim>,
  >(context: TContext, options?: DbContextOptions): InMemoryContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim>;

  public static create<
    TUser extends IdentityUser<TKey>,
    TRole extends IdentityRole<TKey>,
    TKey  extends AllowedPrimaryKeysSafe,
    TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
    TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
    TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
    TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
    TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
    TContext   extends IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim> = IdentityDbContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim>,
  >(arg1: DbConnection | (new (options?: DbContextOptions) => TContext), options?: DbContextOptions): TContext | InMemoryContext<TUser, TRole, TKey, TUserRole, TUserClaim, TUserLogin, TUserToken, TRoleClaim>  {
    if (arg1 instanceof DbConnection)
      return InMemoryContext.initialize(new InMemoryContext(arg1, options));
    if (typeof arg1 === "function")
      return InMemoryContext.initialize<TContext>(new arg1(options)) as TContext;
    
    throw new Error(`Neither valid connection or context constructor provided`);
  }

  protected override onConfiguring(optionsBuilder: DbContextOptionsBuilder): void {
    super.onConfiguring(optionsBuilder);
  }

  public static initialize<TContext extends DbContext>(context: TContext): TContext {
    context.ensureCreated();
    return context;
  }

}
