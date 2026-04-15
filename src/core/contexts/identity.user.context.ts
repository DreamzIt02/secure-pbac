
import { AllowedPrimaryKeysSafe, DbContext, DbContextOptions, DbContextOptionsBuilder, DbSet, ModelBuilder, PrimaryKey } from "../../contexts/index.js";
import { CancellationToken } from "../../types/cancellation.js";
import { IdentitySchemaVersions, StoreOptions, Version } from "../options/index.js";
import { IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserToken } from "../types/index.js";

/// <summary>
/// Base class for the Entity Framework database context used for identity.
/// </summary>
/// <typeparam name="TUser">The type of user objects.</typeparam>
/// <typeparam name="TKey">The type of the primary key for users and roles.</typeparam>
/// <typeparam name="TUserClaim">The type of the user claim object.</typeparam>
/// <typeparam name="TUserLogin">The type of the user login object.</typeparam>
/// <typeparam name="TUserToken">The type of the user token object.</typeparam>
/// <typeparam name="TUserPasskey">The type of the user passkey object.</typeparam>
export abstract class IdentityUserContext<
  TUser extends IdentityUser<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
> extends DbContext {
    public constructor();
    public constructor(options:  DbContextOptions);
    public constructor(options?: DbContextOptions) {
        super(options);
    }

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of Users.
  /// </summary>
  public users!: DbSet<TUser>;

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of User claims.
  /// </summary>
  public userClaims!: DbSet<TUserClaim>;

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of User logins.
  /// </summary>
  public userLogins!: DbSet<TUserLogin>;

  /// <summary>
  /// Gets or sets the <see cref="DbSet{TEntity}"/> of User tokens.
  /// </summary>
  public userTokens!: DbSet<TUserToken>;

  /// <summary>
  /// Gets the schema version used for versioning.
  /// </summary>
  protected get schemaVersion(): Version {
    return this.getStoreOptions()?.schemaVersion ?? IdentitySchemaVersions.version1;
  }

  protected getStoreOptions(): StoreOptions | undefined {
    return this.options?.identityOptions?.stores;
  }
  // private StoreOptions? GetStoreOptions() => this.GetService<IDbContextOptions>()
  //                   .Extensions.OfType<CoreOptionsExtension>()
  //                   .FirstOrDefault()?.ApplicationServiceProvider
  //                   ?.GetService<IOptions<IdentityOptions>>()
  //                   ?.Value?.Stores;

  protected override onConfiguring(builder?: DbContextOptionsBuilder): void {
    super.onConfiguring(builder);
  }

  /// <summary>
  /// Configures the schema needed for the identity framework.
  /// </summary>
  protected override onModelCreating(builder: ModelBuilder): void {
    super.onModelCreating(builder)
    const version = this.getStoreOptions()?.schemaVersion ?? IdentitySchemaVersions.version1;
    this.onModelCreatingVersion(builder, version);
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for a specific schema version.
  /// </summary>
  protected onModelCreatingVersion(builder: ModelBuilder, schemaVersion: Version): void {
    if (schemaVersion >= IdentitySchemaVersions.version3) {
      this.onModelCreatingVersion3(builder);
    } else if (schemaVersion >= IdentitySchemaVersions.version2) {
      this.onModelCreatingVersion2(builder);
    } else {
      this.onModelCreatingVersion1(builder);
    }
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 3.0
  /// </summary>
  protected onModelCreatingVersion3(builder: ModelBuilder): void {
    this.users      = this.register<TUser>(IdentityUser as new () => TUser, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userClaims = this.register<TUserClaim>(IdentityUserClaim as new () => TUserClaim, new PrimaryKey({ userId: "string", claimType: "string" }, { auto: false }));
    this.userLogins = this.register<TUserLogin>(IdentityUserLogin as new () => TUserLogin, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
    this.userTokens = this.register<TUserToken>(IdentityUserToken as new () => TUserToken, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 2.0
  /// </summary>
  protected onModelCreatingVersion2(builder: ModelBuilder): void {
    this.users      = this.register<TUser>(IdentityUser as new () => TUser, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userClaims = this.register<TUserClaim>(IdentityUserClaim as new () => TUserClaim, new PrimaryKey({ userId: "string", claimType: "string" }, { auto: false }));
    this.userLogins = this.register<TUserLogin>(IdentityUserLogin as new () => TUserLogin, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
    this.userTokens = this.register<TUserToken>(IdentityUserToken as new () => TUserToken, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
  }

  /// <summary>
  /// Configures the schema needed for the identity framework for schema version 1.0
  /// </summary>
  protected onModelCreatingVersion1(builder: ModelBuilder): void {
    // this.users      = this.register<IdentityUser<TKey>>(IdentityUser, new PrimaryKey({ id: "string" }, { auto: true }));
    // this.roles      = this.register<IdentityRole<TKey>>(IdentityRole, new PrimaryKey({ id: "string" }, { auto: true }));

    // this.userRoles  = this.register<IdentityUserRole<TKey>> (IdentityUserRole,  new PrimaryKey({ userId: "string", roleId: "string" }, { auto: false }));
    // this.userClaims = this.register<IdentityUserClaim<TKey>>(IdentityUserClaim, new PrimaryKey({ userId: "string", claimType: "string" }, { auto: false }));
    // this.userLogins = this.register<IdentityUserLogin<TKey>>(IdentityUserLogin, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
    // this.userTokens = this.register<IdentityUserToken<TKey>>(IdentityUserToken, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
    // this.roleClaims = this.register<IdentityRoleClaim<TKey>>(IdentityRoleClaim, new PrimaryKey({ roleId: "string", claimType: "string" }, { auto: false }));

    this.users      = this.register<TUser>(IdentityUser as new () => TUser, new PrimaryKey({ id: "string" }, { auto: true }));

    this.userClaims = this.register<TUserClaim>(IdentityUserClaim as new () => TUserClaim, new PrimaryKey({ userId: "string", claimType: "string" }, { auto: false }));
    this.userLogins = this.register<TUserLogin>(IdentityUserLogin as new () => TUserLogin, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
    this.userTokens = this.register<TUserToken>(IdentityUserToken as new () => TUserToken, new PrimaryKey({ userId: "string", loginProvider: "string" }, { auto: false }));
  }

  /// <summary>
  /// Persists all changes to the underlying store.
  /// </summary>
  public override async saveChangesAsync(cancellationToken: CancellationToken): Promise<void> {
      cancellationToken.throwIfCancellationRequested();
      // Inject custom task, before changes applied to the DbContext
      await super.saveChangesAsync(cancellationToken)
  }
}
