// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser, UserLoginInfo } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for storing information that maps external login information provided
 * by Microsoft Account, Facebook etc. to a user account.
 * @typeparam TUser The type that represents a user.
 */
export interface IUserLoginStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Adds an external UserLoginInfo to the specified user.
     * @param user The user to add the login to.
     * @param login The external UserLoginInfo to add to the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    addLoginAsync(
        user: TUser,
        login: UserLoginInfo,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Attempts to remove the provided login information from the specified user
     * and returns a flag indicating whether the removal succeeded or not.
     * @param user The user to remove the login information from.
     * @param loginProvider The login provider whose information should be removed.
     * @param providerKey The key given by the external login provider for the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeLoginAsync(
        user: TUser,
        loginProvider: string,
        providerKey: string,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Retrieves the associated logins for the specified user.
     * @param user The user whose associated logins to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a list of UserLoginInfo for the specified user, if any.
     */
    getLoginsAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<UserLoginInfo[]>;

    /**
     * Retrieves the user associated with the specified login provider and login provider key.
     * @param loginProvider The login provider who provided the providerKey.
     * @param providerKey The key provided by the loginProvider to identify a user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user, if any, which matched the specified login provider and key.
     */
    findByLoginAsync(
        loginProvider: string,
        providerKey: string,
        cancellationToken: CancellationToken
    ): Promise<TUser | null>;
}
