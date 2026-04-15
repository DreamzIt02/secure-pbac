import { Claim } from "../../../claims/index.js";
import { AllowedPrimaryKeysSafe, DbContext, DbSet, TypeDescriptor } from "../../../contexts/index.js";
import { IQueryable } from "../../../linq/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { ArgumentNullException, ArgumentNullThrowHelper } from "../../../types/exception.js";
import { randomUUID } from "../../../utils.js";
import { IdentityErrorDescriber, IdentityResult } from "../../identity/index.js";
import { IdentityRole, IdentityRoleClaim, IdentityUserRole } from "../../types/index.js";
import { IQueryableRoleStore } from "../stores/index.js";
import { IRoleClaimStore } from "./role.claim.store.js";
import { RoleStoreBase } from "./role.store.base.js";

/// <summary>
/// Creates a new instance of a persistence store for roles.
/// </summary>
/// <typeparam name="TRole">The type of the class representing a role.</typeparam>
/// <typeparam name="TContext">The type of the data context class used to access the store.</typeparam>
/// <typeparam name="TKey">The type of the primary key for a role.</typeparam>
/// <typeparam name="TUserRole">The type of the class representing a user role.</typeparam>
/// <typeparam name="TRoleClaim">The type of the class representing a role claim.</typeparam>
export class RoleStore<
  TRole    extends IdentityRole<TKey>,
  TKey     extends AllowedPrimaryKeysSafe,
  TContext extends DbContext,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
> extends RoleStoreBase<TRole, TKey, TUserRole, TRoleClaim>
  implements IQueryableRoleStore<TKey, TRole>, IRoleClaimStore<TKey, TRole>
{

  /// <summary>
  /// Constructs a new instance of <see cref="RoleStore{TRole, TContext, TKey, TUserRole, TRoleClaim}"/>.
  /// </summary>
  /// <param name="context">The <see cref="DbContext"/>.</param>
  /// <param name="describer">The <see cref="IdentityErrorDescriber"/>.</param>
  constructor(
    private readonly context: TContext,
    
    describer?: IdentityErrorDescriber) {
    ArgumentNullThrowHelper.throwIfNull(context);
    
    super(describer ?? new IdentityErrorDescriber());
  }

    /// <summary>
  /// Gets or sets a flag indicating if changes should be persisted after CreateAsync, UpdateAsync and DeleteAsync are called.
  /// </summary>
  /// <value>
  /// True if changes should be automatically persisted, otherwise false.
  /// </value>
  public autoSaveChanges: boolean = true;

  /// <summary>Saves the current store.</summary>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>The <see cref="Promise"/> that represents the asynchronous operation.</returns>
  protected async saveChanges(cancellationToken: CancellationToken): Promise<void> {
    if (this.autoSaveChanges) {
      await this.context.saveChangesAsync(cancellationToken);
    }
  }

    /// <summary>
  /// Creates a new role in a store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role to create in the store.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{IdentityResult}"/> that represents the <see cref="IdentityResult"/> of the asynchronous query.</returns>
  public async createAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<IdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    this.context.add(role);
    await this.saveChanges(cancellationToken);
    return IdentityResult.success();
  }

  /// <summary>
  /// Updates a role in a store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role to update in the store.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{IdentityResult}"/> that represents the <see cref="IdentityResult"/> of the asynchronous query.</returns>
  public async updateAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<IdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    this.context.attach(role);
    role.concurrencyStamp = randomUUID();
    this.context.update(role);
    try {
      await this.saveChanges(cancellationToken);
    } catch (err) {
        return IdentityResult.failed(this.errorDescriber.concurrencyFailure());
    }
    return IdentityResult.success();
  }

  /// <summary>
  /// Deletes a role from the store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role to delete from the store.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{IdentityResult}"/> that represents the <see cref="IdentityResult"/> of the asynchronous query.</returns>
  public async deleteAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<IdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    this.context.remove(role);
    try {
      await this.saveChanges(cancellationToken);
    } catch (err) {
        return IdentityResult.failed(this.errorDescriber.concurrencyFailure());
    }
    return IdentityResult.success();
  }

  /// <summary>
  /// Gets the ID for a role from the store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose ID should be returned.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{string}"/> that contains the ID of the role.</returns>
  public async getRoleIdAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<string> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    return Promise.resolve(this.convertIdToString(role.id)!);
  }

  /// <summary>
  /// Gets the name of a role from the store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose name should be returned.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{string}"/> that contains the name of the role.</returns>
  public async getRoleNameAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    return Promise.resolve(role.name ?? null);
  }

  /// <summary>
  /// Sets the name of a role in the store as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose name should be set.</param>
  /// <param name="roleName">The name of the role.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>The <see cref="Promise"/> that represents the asynchronous operation.</returns>
  public async setRoleNameAsync(
    role: TRole,
    roleName: string | null,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    role.name = roleName;
    return Promise.resolve();
  }

    /// <summary>
    /// Converts the provided <paramref name="id"/> to a strongly typed key object.
    /// </summary>
    public convertIdFromString<TKey>(id?: string | null): TKey | null {
        if (id === undefined || id == null) return null;

        // Delegate to TypeDescriptor
        return TypeDescriptor.convertFromString<TKey>(id, "" as TKey) as TKey;
    }

    /// <summary>
    /// Converts the provided <paramref name="id"/> to its string representation.
    /// </summary>
    public convertIdToString<TKey>(id: TKey): string | null {
        if (id === undefined || id == null) return null;

        return TypeDescriptor.convertToString(id);
    }

    /// <summary>
    /// Finds the role who has the specified ID as an asynchronous operation.
    /// </summary>
    /// <param name="id">The role ID to look for.</param>
    /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
    /// <returns>A <see cref="Promise{TRole}"/> that result of the look up.</returns>
    public async findByIdAsync(
        id: string,
        cancellationToken: CancellationToken = CancellationToken.none
    ): Promise<TRole | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        const roleId = this.convertIdFromString(id);
        return this.roles.firstOrDefault((u: TRole) => u.id === roleId);
    }

  /// <summary>
  /// Finds the role who has the specified normalized name as an asynchronous operation.
  /// </summary>
  /// <param name="normalizedName">The normalized role name to look for.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{TRole}"/> that result of the look up.</returns>
  public async findByNameAsync(
    normalizedName: string,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<TRole | null> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();

    return this.roles.firstOrDefault((r: TRole) => r.normalizedName === normalizedName);
  }

  /// <summary>
  /// Get a role's normalized name as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose normalized name should be retrieved.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{string}"/> that contains the name of the role.</returns>
  public async getNormalizedRoleNameAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
        ArgumentNullException.throwIfNull(role);
    return Promise.resolve(role.normalizedName);
  }

  /// <summary>
  /// Set a role's normalized name as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose normalized name should be set.</param>
  /// <param name="normalizedName">The normalized name to set</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>The <see cref="Promise"/> that represents the asynchronous operation.</returns>
  public async setNormalizedRoleNameAsync(
    role: TRole,
    normalizedName: string | null,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    // role.normalizedName = normalizedName;
  }


  /// <summary>
  /// Get the claims associated with the specified <paramref name="role"/> as an asynchronous operation.
  /// </summary>
  /// <param name="role">The role whose claims should be retrieved.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>A <see cref="Promise{Claim[]}"/> that contains the claims granted to a role.</returns>
  public async getClaimsAsync(
    role: TRole,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<Claim[]> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);

    return await this.roleClaims
      .where((rc: IdentityRoleClaim<TKey>) => rc.roleId === role.id)
      .select((c: IdentityRoleClaim<TKey>) => new Claim(c.claimType!, c.claimValue!))
      .toArray();
  }

  /// <summary>
  /// Adds the <paramref name="claim"/> given to the specified <paramref name="role"/>.
  /// </summary>
  /// <param name="role">The role to add the claim to.</param>
  /// <param name="claim">The claim to add to the role.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>The <see cref="Promise"/> that represents the asynchronous operation.</returns>
  public async addClaimAsync(
    role: TRole,
    claim: Claim,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    ArgumentNullException.throwIfNull(claim);

    this.roleClaims.add(this.createRoleClaim(IdentityRoleClaim as new () => TRoleClaim, role, claim));
    return Promise.resolve();
  }

  /// <summary>
  /// Removes the <paramref name="claim"/> given from the specified <paramref name="role"/>.
  /// </summary>
  /// <param name="role">The role to remove the claim from.</param>
  /// <param name="claim">The claim to remove from the role.</param>
  /// <param name="cancellationToken">The <see cref="CancellationToken"/> used to propagate notifications that the operation should be canceled.</param>
  /// <returns>The <see cref="Promise"/> that represents the asynchronous operation.</returns>
  public async removeClaimAsync(
    role: TRole,
    claim: Claim,
    cancellationToken: CancellationToken = CancellationToken.none
  ): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullException.throwIfNull(role);
    ArgumentNullException.throwIfNull(claim);

    const claims = await this.roleClaims
      .where(
        (rc: IdentityRoleClaim<TKey>) =>
          rc.roleId === role.id &&
          rc.claimValue === claim.value &&
          rc.claimType === claim.type
      )
      .toArray();

    for (const c of claims) {
      this.roleClaims.remove(c);
    }
  }

  /// <summary>
  /// A navigation property for the roles the store contains.
  /// </summary>
  public get roles(): IQueryable<TRole> {
    return this.context.set<TRole>(IdentityRole as new () => TRole);
  }

  private get roleClaims(): DbSet<TRoleClaim> {
    return this.context.set<TRoleClaim>(IdentityRoleClaim as new () => TRoleClaim);
  }

  /// <summary>
  /// Creates an entity representing a role claim.
  /// </summary>
  /// <param name="role">The associated role.</param>
  /// <param name="claim">The associated claim.</param>
  /// <returns>The role claim entity.</returns>
  protected createRoleClaim(ctor: new () => TRoleClaim, role: TRole, claim: Claim): TRoleClaim {
    const roleClaim: TRoleClaim = new ctor();

    roleClaim.roleId = role.id;
    roleClaim.claimType = claim.type;
    roleClaim.claimValue = claim.value;

    return roleClaim;
  }
}
