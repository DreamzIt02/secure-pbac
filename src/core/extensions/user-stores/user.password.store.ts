// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store containing users' password hashes.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserPasswordStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets the password hash for the specified user.
     * @param user The user whose password hash to set.
     * @param passwordHash The password hash to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setPasswordHashAsync(
        user: TUser,
        passwordHash: string | null,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Gets the password hash for the specified user.
     * @param user The user whose password hash to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise returning the password hash for the specified user.
     */
    getPasswordHashAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<string | null>;

    /**
     * Gets a flag indicating whether the specified user has a password.
     * @param user The user to return a flag for, indicating whether they have a password or not.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise returning true if the specified user has a password, otherwise false.
     */
    hasPasswordAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<boolean>;
}
