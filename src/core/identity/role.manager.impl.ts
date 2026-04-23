

import { Claim } from "../../claims/index.js";
import { IClaim } from "../../claims/types.js";
import { ILookupNormalizer, IQueryableRoleStore, IRoleClaimStore, IRoleStore, LookupNormalizer } from "../extensions/index.js";
import { ArgumentNullThrowHelper, NotSupportedException, ObjectDisposedThrowHelper } from "../../types/exception.js";
import { IdentityRole } from "../types/index.js";
import { IRoleValidator, RoleValidator } from "../validators/index.js";
import { IdentityErrorDescriber } from "./identity.error.describer.js";
import { IdentityError } from "./identity.error.js";
import { IdentityResult } from "./identity.result.js";
import { CancellationToken } from "../../types/cancellation.js";
import { IQueryable } from "../../linq/index.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { RoleStore } from "../extensions/role-stores/index.js";
import { Inject } from "../../decorators/index.js";
import { IRoleManager } from "./role.manager.js";

/// <summary>
/// Provides the APIs for managing roles in a persistence store.
/// </summary>
/// <typeparam name="TRole">The type encapsulating a role.</typeparam>
export class RoleManager<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> implements IRoleManager<TKey, TRole> {
    private disposed: boolean = false;

    /// <summary>
    /// The cancellation token used to cancel operations.
    /// </summary>
    protected get cancellationToken(): CancellationToken {
        return CancellationToken.none;
    }

    /// <summary>
    /// Constructs a new instance of RoleManager{TRole}.
    /// </summary>
    constructor(
        @Inject(RoleStore) protected readonly store: IRoleStore<TKey, TRole>,
        @Inject([RoleValidator]) roleValidators: Iterable<IRoleValidator<TKey, TRole>> | null,
        @Inject(LookupNormalizer) protected readonly keyNormalizer: ILookupNormalizer,
        public errorDescriber: IdentityErrorDescriber,
    ) {
        ArgumentNullThrowHelper.throwIfNull(store);
        if (roleValidators) {
            if (Array.isArray(roleValidators))
                this.roleValidators.push(...roleValidators);
            else
                this.roleValidators.push(roleValidators as any);
        }
    }

    /// <summary>
    /// Gets a list of validators for roles to call before persistence.
    /// </summary>
    public roleValidators: IRoleValidator<TKey, TRole>[] = [];

    /// <summary>
    /// Gets an IQueryable collection of Roles if the persistence store is an IQueryableRoleStore{TRole}.
    /// </summary>
    public get roles(): IQueryable<TRole> {
        const queryableStore = this.store as IQueryableRoleStore<TKey, TRole>;
        if (!queryableStore) {
            throw new NotSupportedException("Store is not IQueryableRoleStore");
        }
        return queryableStore.roles;
    }

    /// <summary>
    /// Gets a flag indicating whether the underlying persistence store supports returning an IQueryable collection of roles.
    /// </summary>
    public get supportsQueryableRoles(): boolean {
        this.throwIfDisposed();
        // return this.store instanceof IQueryableRoleStore;
        return (this.store as IQueryableRoleStore<TKey, TRole>) !== undefined;

    }

    /// <summary>
    /// Gets a flag indicating whether the underlying persistence store supports Claims for roles.
    /// </summary>
    public get supportsRoleClaims(): boolean {
        this.throwIfDisposed();
        // return this.store instanceof IRoleClaimStore;
        return (this.store as IRoleClaimStore<TKey, TRole>) !== undefined;
    }

    /// <summary>
    /// Creates the specified role in the persistence store.
    /// </summary>
    public async createAsync(role: TRole): Promise<IdentityResult> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        let result = await this.validateRoleAsync(role);
        if (!result.succeeded) {
            return result;
        }
        result = await this.store.createAsync(role, this.cancellationToken);
        return result;
    }

    /// <summary>
    /// Updates the specified role.
    /// </summary>
    public updateAsync(role: TRole): Promise<IdentityResult> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return this.updateRoleAsync(role);
    }

    /// <summary>
    /// Deletes the specified role.
    /// </summary>
    public deleteAsync(role: TRole): Promise<IdentityResult> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(role);
        return this.store.deleteAsync(role, this.cancellationToken);
    }

    /// <summary>
    /// Gets a flag indicating whether the specified roleName exists.
    /// </summary>
    public async roleExistsAsync(roleName: string): Promise<boolean> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(roleName);
        return (await this.findByNameAsync(roleName)) != null;
    }

    /// <summary>
    /// Gets a normalized representation of the specified key.
    /// </summary>
    public normalizeKey(key: string | null): string | null {
        return this.keyNormalizer == null ? key : this.keyNormalizer.normalizeName(key);
    }

    /// <summary>
    /// Finds the role associated with the specified roleId if any.
    /// </summary>
    public findByIdAsync(roleId: string): Promise<TRole | null> {
        this.throwIfDisposed();
        return this.store.findByIdAsync(roleId, this.cancellationToken);
    }

    /// <summary>
    /// Gets the name of the specified role.
    /// </summary>
    public getRoleNameAsync(role: TRole): Promise<string | null> {
        this.throwIfDisposed();
        return this.store.getRoleNameAsync(role, this.cancellationToken);
    }

    /// <summary>
    /// Sets the name of the specified role.
    /// </summary>
    public async setRoleNameAsync(role: TRole, name: string | null): Promise<IdentityResult> {
        this.throwIfDisposed();
        await this.store.setRoleNameAsync(role, name, this.cancellationToken);
        return IdentityResult.success();
    }

        /// <summary>
    /// Gets the ID of the specified role.
    /// </summary>
    public getRoleIdAsync(role: TRole): Promise<string> {
        this.throwIfDisposed();
        return this.store.getRoleIdAsync(role, this.cancellationToken);
    }

    /// <summary>
    /// Finds the role associated with the specified roleName if any.
    /// </summary>
    public findByNameAsync(roleName: string): Promise<TRole | null> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(roleName);
        return this.store.findByNameAsync(this.normalizeKey(roleName)!, this.cancellationToken);
    }

    /// <summary>
    /// Adds a claim to a role.
    /// </summary>
    public async addClaimAsync(role: TRole, claim: Claim): Promise<IdentityResult> {
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(claim);
        ArgumentNullThrowHelper.throwIfNull(role);

        const claimStore = this.getClaimStore();
        await claimStore.addClaimAsync(role, claim, this.cancellationToken);
        return await this.updateRoleAsync(role);
    }

    /// <summary>
    /// Removes a claim from a role.
    /// </summary>
    public async removeClaimAsync(role: TRole, claim: Claim): Promise<IdentityResult> {
        this.throwIfDisposed();
        const claimStore = this.getClaimStore();
        ArgumentNullThrowHelper.throwIfNull(role);
        await claimStore.removeClaimAsync(role, claim, this.cancellationToken);
        return await this.updateRoleAsync(role);
    }

    /// <summary>
    /// Gets a list of claims associated with the specified role.
    /// </summary>
    public getClaimsAsync(role: TRole): Promise<IClaim[]> {
        this.throwIfDisposed();
        const claimStore = this.getClaimStore();
        ArgumentNullThrowHelper.throwIfNull(role);
        return claimStore.getClaimsAsync(role, this.cancellationToken);
    }

    /// <summary>
    /// Releases all resources used by the role manager.
    /// </summary>
    public dispose(): void {
        this.disposeInternal(true);
    }

    /// <summary>
    /// Releases the unmanaged resources used by the role manager and optionally releases the managed resources.
    /// </summary>
    protected disposeInternal(disposing: boolean): void {
        if (disposing && !this.disposed) {
            this.store.dispose();
        }
        this.disposed = true;
    }

    /// <summary>
    /// Should return IdentityResult.success if validation is successful.
    /// </summary>
    protected async validateRoleAsync(role: TRole): Promise<IdentityResult> {
        let errors: IdentityError[] | null = null;
        for (const v of this.roleValidators) {
            const result = await v.validateAsync(this as any, role);
            if (!result.succeeded) {
                errors ??= [];
                errors.push(...result.errors);
            }
        }
        if (errors?.length && errors.length > 0) {
            return IdentityResult.failed(errors);
        }
        return IdentityResult.success();
    }

    /// <summary>
    /// Called to update the role after validating and updating the normalized role name.
    /// </summary>
    protected async updateRoleAsync(role: TRole): Promise<IdentityResult> {
        const result = await this.validateRoleAsync(role);
        if (!result.succeeded) {
            return result;
        }
        return await this.store.updateAsync(role, this.cancellationToken);
    }

    // IRoleClaimStore methods
    private getClaimStore(): IRoleClaimStore<TKey, TRole> {
        const cast = this.store as IRoleClaimStore<TKey, TRole>;
        if (!cast) {
            throw new NotSupportedException("Store is not IRoleClaimStore");
        }
        return cast;
    }

    /// <summary>
    /// Throws if this class has been disposed.
    /// </summary>
    protected throwIfDisposed(): void {
        ObjectDisposedThrowHelper.throwIf(this.disposed, this);
    }

}

