// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IdentityRole } from "../../types/identity.role.js";

/**
 * Provides an abstraction for a storage and management of roles.
 * @typeparam TRole The type that represents a role.
 */
export interface IRoleStore<TRole extends IdentityRole> extends Disposable {
    dispose(): unknown;
    /**
     * Creates a new role in a store as an asynchronous operation.
     * @param role The role to create in the store.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the IdentityResult of the asynchronous query.
     */
    createAsync(role: TRole, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Updates a role in a store as an asynchronous operation.
     * @param role The role to update in the store.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the IdentityResult of the asynchronous query.
     */
    updateAsync(role: TRole, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Deletes a role from the store as an asynchronous operation.
     * @param role The role to delete from the store.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the IdentityResult of the asynchronous query.
     */
    deleteAsync(role: TRole, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Gets the ID for a role from the store as an asynchronous operation.
     * @param role The role whose ID should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that contains the ID of the role.
     */
    getRoleIdAsync(role: TRole, cancellationToken: CancellationToken): Promise<string>;

    /**
     * Gets the name of a role from the store as an asynchronous operation.
     * @param role The role whose name should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that contains the name of the role.
     */
    getRoleNameAsync(role: TRole, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Sets the name of a role in the store as an asynchronous operation.
     * @param role The role whose name should be set.
     * @param roleName The name of the role.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setRoleNameAsync(role: TRole, roleName: string | null, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Get a role's normalized name as an asynchronous operation.
     * @param role The role whose normalized name should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that contains the name of the role.
     */
    getNormalizedRoleNameAsync(role: TRole, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Set a role's normalized name as an asynchronous operation.
     * @param role The role whose normalized name should be set.
     * @param normalizedName The normalized name to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setNormalizedRoleNameAsync(role: TRole, normalizedName: string | null, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Finds the role who has the specified ID as an asynchronous operation.
     * @param roleId The role ID to look for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that contains the result of the lookup.
     */
    findByIdAsync(roleId: string, cancellationToken: CancellationToken): Promise<TRole | null>;

    /**
     * Finds the role who has the specified normalized name as an asynchronous operation.
     * @param normalizedRoleName The normalized role name to look for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that contains the result of the lookup.
     */
    findByNameAsync(normalizedRoleName: string, cancellationToken: CancellationToken): Promise<TRole | null>;
}
