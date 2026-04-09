// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction to store a flag indicating whether a user has two factor authentication enabled.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserTwoFactorStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets a flag indicating whether the specified user has two factor authentication enabled or not,
     * as an asynchronous operation.
     * @param user The user whose two factor authentication enabled status should be set.
     * @param enabled A flag indicating whether the specified user has two factor authentication enabled.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setTwoFactorEnabledAsync(
        user: TUser,
        enabled: boolean,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Returns a flag indicating whether the specified user has two factor authentication enabled or not,
     * as an asynchronous operation.
     * @param user The user whose two factor authentication enabled status should be set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a flag indicating whether the specified user has two factor authentication enabled or not.
     */
    getTwoFactorEnabledAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<boolean>;
}
