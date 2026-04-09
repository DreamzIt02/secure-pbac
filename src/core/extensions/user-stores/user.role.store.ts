// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/identity.user.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which maps users to roles.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserRoleStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Add the specified user to the named role.
     * @param user The user to add to the named role.
     * @param roleName The name of the role to add the user to.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    addToRoleAsync(user: TUser, roleName: string, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Remove the specified user from the named role.
     * @param user The user to remove the named role from.
     * @param roleName The name of the role to remove.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeFromRoleAsync(user: TUser, roleName: string, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Gets a list of role names the specified user belongs to.
     * @param user The user whose role names to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a list of role names.
     */
    getRolesAsync(user: TUser, cancellationToken: CancellationToken): Promise<string[]>;

    /**
     * Returns a flag indicating whether the specified user is a member of the given named role.
     * @param user The user whose role membership should be checked.
     * @param roleName The name of the role to be checked.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a flag indicating whether the specified user is a member of the named role.
     */
    isInRoleAsync(user: TUser, roleName: string, cancellationToken: CancellationToken): Promise<boolean>;

    /**
     * Returns a list of users who are members of the named role.
     * @param roleName The name of the role whose membership should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a list of users who are in the named role.
     */
    getUsersInRoleAsync(roleName: string, cancellationToken: CancellationToken): Promise<TUser[]>;
}
