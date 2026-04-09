// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which stores info about user's authenticator.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserAuthenticatorKeyStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets the authenticator key for the specified user.
     * @param user The user whose authenticator key should be set.
     * @param key The authenticator key to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setAuthenticatorKeyAsync(
        user: TUser,
        key: string,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Gets the authenticator key for the specified user.
     * @param user The user whose authenticator key should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation, containing the authenticator key for the specified user.
     */
    getAuthenticatorKeyAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<string | null>;
}
