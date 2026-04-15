
import { AllowedPrimaryKeysSafe, DbContextOptions, DbContextOptionsBuilder, DbSet, ModelBuilder, PrimaryKey } from "../../contexts/index.js";
import { IdentityRole, IdentityRoleClaim, IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserRole, IdentityUserToken } from "../types/index.js";
import { IdentityUserContext } from "./identity.user.context.js";

/// <summary>
/// Base class for the Entity Framework database context used for identity.
/// </summary>
/// <typeparam name="TUser">The type of user objects.</typeparam>
/// <typeparam name="TRole">The type of role objects.</typeparam>
/// <typeparam name="TKey">The type of the primary key for users and roles.</typeparam>
/// <typeparam name="TUserClaim">The type of the user claim object.</typeparam>
/// <typeparam name="TUserRole">The type of the user role object.</typeparam>
/// <typeparam name="TUserLogin">The type of the user login object.</typeparam>
/// <typeparam name="TRoleClaim">The type of the role claim object.</typeparam>
/// <typeparam name="TUserToken">The type of the user token object.</typeparam>
/// <typeparam name="TUserPasskey">The type of the user passkey object.</typeparam>
export abstract class IdentityDbContext<
  TUser extends IdentityUser<TKey>,
  TRole extends IdentityRole<TKey>,
  TKey extends AllowedPrimaryKeysSafe,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,

> extends IdentityUserContext<TUser, TKey, TUserClaim, TUserLogin, TUserToken> {
    public constructor();
    public constructor(options:  DbContextOptions);
    public constructor(options?: DbContextOptions) {
      super(options as DbContextOptions);
    }

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of User roles.
  /// </summary>
  public userRoles!: DbSet<TUserRole>;

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of roles.
  /// </summary>
  public roles!: DbSet<TRole>;

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of role claims.
  /// </summary>
  public roleClaims!: DbSet<TRoleClaim>;

  protected override onConfiguring(builder?: DbContextOptionsBuilder): void {
    super.onConfiguring(builder);
  }

  /// <summary>
  /// Configures the schema needed for the identity framework.
  /// </summary>
  protected override onModelCreating(builder: ModelBuilder): void {
    super.onModelCreating(builder);
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 3.0
  /// </summary>
  protected override onModelCreatingVersion3(builder: ModelBuilder): void {
    super.onModelCreatingVersion3(builder);
    this.roles      = this.register<TRole>(IdentityRole as new () => TRole, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userRoles  = this.register<TUserRole> (IdentityUserRole as new () => TUserRole,   new PrimaryKey({ userId: "string", roleId: "string" }, { auto: false }));
    this.roleClaims = this.register<TRoleClaim>(IdentityRoleClaim as new () => TRoleClaim, new PrimaryKey({ roleId: "string", claimType: "string" }, { auto: false }));
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 2.0
  /// </summary>
  protected override onModelCreatingVersion2(builder: ModelBuilder): void {
    super.onModelCreatingVersion3(builder);
    this.roles      = this.register<TRole>(IdentityRole as new () => TRole, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userRoles  = this.register<TUserRole> (IdentityUserRole as new () => TUserRole,   new PrimaryKey({ userId: "string", roleId: "string" }, { auto: false }));
    this.roleClaims = this.register<TRoleClaim>(IdentityRoleClaim as new () => TRoleClaim, new PrimaryKey({ roleId: "string", claimType: "string" }, { auto: false }));
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 1.0
  /// </summary>
  protected override onModelCreatingVersion1(builder: ModelBuilder): void {
    super.onModelCreatingVersion3(builder);
    this.roles      = this.register<TRole>(IdentityRole as new () => TRole, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userRoles  = this.register<TUserRole> (IdentityUserRole as new () => TUserRole,   new PrimaryKey({ userId: "string", roleId: "string" }, { auto: false }));
    this.roleClaims = this.register<TRoleClaim>(IdentityRoleClaim as new () => TRoleClaim, new PrimaryKey({ roleId: "string", claimType: "string" }, { auto: false }));
  }
}
