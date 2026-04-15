// role.store.base.ts

import { Claim } from "../../../claims/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { ArgumentNullThrowHelper, ObjectDisposedThrowHelper } from "../../../types/exception.js";
import { IdentityErrorDescriber, IdentityResult } from "../../identity/index.js";
import { IdentityRole, IdentityRoleClaim, IdentityUserRole } from "../../types/index.js";
import { IQueryable } from "../../../linq/queryable.js";
import { IQueryableRoleStore } from "../stores/index.js";
import { IRoleClaimStore } from "./role.claim.store.js";
import { AllowedPrimaryKeysSafe, TypeDescriptor } from "../../../contexts/index.js";

/// <summary>
/// Creates a new instance of a persistence store for roles.
/// </summary>
/// <typeparam name="TRole">The type of the class representing a role.</typeparam>
/// <typeparam name="TKey">The type of the primary key for a role.</typeparam>
/// <typeparam name="TUserRole">The type of the class representing a user role.</typeparam>
/// <typeparam name="TRoleClaim">The type of the class representing a role claim.</typeparam>
export abstract class RoleStoreBase<
  TRole extends IdentityRole<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>
> implements IQueryableRoleStore<TKey, TRole>, IRoleClaimStore<TKey, TRole> {

    /// <summary>
    /// Creates a new instance.
    /// </summary>
    /// <param name="describer">The IdentityErrorDescriber used to describe store errors.</param>
    constructor(describer: IdentityErrorDescriber) {
        ArgumentNullThrowHelper.throwIfNull(describer);
        this.errorDescriber = describer;
    }
  
    [Symbol.dispose](): void {
        // TODO: Dispose
    }

    private _disposed: boolean = false;

    /// <summary>
    /// Gets or sets the IdentityErrorDescriber for any error that occurred with the current operation.
    /// </summary>
    public errorDescriber!: IdentityErrorDescriber;

    /// <summary>
    /// Creates a new role in a store as an asynchronous operation.
    /// </summary>
    public abstract createAsync(role: TRole, cancellationToken?: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Updates a role in a store as an asynchronous operation.
    /// </summary>
    public abstract updateAsync(role: TRole, cancellationToken?: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Deletes a role from the store as an asynchronous operation.
    /// </summary>
    public abstract deleteAsync(role: TRole, cancellationToken?: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Gets the ID for a role from the store.
    /// </summary>
    public async getRoleIdAsync(role: TRole, cancellationToken: CancellationToken = CancellationToken.none): Promise<string> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return Promise.resolve(this.convertIdToString(role.id)!);
    }

    /// <summary>
    /// Gets the name of a role from the store.
    /// </summary>
    public async getRoleNameAsync(role: TRole, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return Promise.resolve(role.name ?? null);
    }

    /// <summary>
    /// Sets the name of a role in the store.
    /// </summary>
    public async setRoleNameAsync(role: TRole, roleName: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        role.name = roleName ?? null;
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
    /// Finds the role who has the specified ID.
    /// </summary>
    public abstract findByIdAsync(id: string, cancellationToken?: CancellationToken): Promise<TRole | null>;

    /// <summary>
    /// Finds the role who has the specified normalized name.
    /// </summary>
    public abstract findByNameAsync(normalizedName: string, cancellationToken?: CancellationToken): Promise<TRole | null>;

    /// <summary>
    /// Get a role's normalized name.
    /// </summary>
    public async getNormalizedRoleNameAsync(role: TRole, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return Promise.resolve(role.name?.toUpperCase() ?? null);
    }

    /// <summary>
    /// Set a role's normalized name.
    /// </summary>
    public async setNormalizedRoleNameAsync(role: TRole, normalizedName: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return Promise.resolve();
    }

    /// <summary>
    /// Throws if this class has been disposed.
    /// </summary>
    protected throwIfDisposed(): void {
        ObjectDisposedThrowHelper.throwIf(this._disposed, this);
    }

    /// <summary>
    /// Dispose the store.
    /// </summary>
    public dispose(): void {
        this._disposed = true;
    }

    /// <summary>
    /// Get the claims associated with the specified role.
    /// </summary>
    public abstract getClaimsAsync(role: TRole, cancellationToken?: CancellationToken): Promise<Claim[]>;

    /// <summary>
    /// Adds the claim given to the specified role.
    /// </summary>
    public abstract addClaimAsync(role: TRole, claim: Claim, cancellationToken?: CancellationToken): Promise<void>;

    /// <summary>
    /// Removes the claim given from the specified role.
    /// </summary>
    public abstract removeClaimAsync(role: TRole, claim: Claim, cancellationToken?: CancellationToken): Promise<void>;

    /// <summary>
    /// A navigation property for the roles the store contains.
    /// </summary>
    public abstract roles: IQueryable<TRole>;

    /// <summary>
    /// Creates an entity representing a role claim.
    /// </summary>
    protected createRoleClaim(ctor: new () => TRoleClaim, role: TRole, claim: Claim): TRoleClaim {
        const roleClaim: TRoleClaim = new ctor();

        roleClaim.roleId = role.id;
        roleClaim.claimType = claim.type;
        roleClaim.claimValue = claim.value;

        return roleClaim as TRoleClaim;
    }
}
