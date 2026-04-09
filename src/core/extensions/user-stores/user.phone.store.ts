// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store containing users' telephone numbers.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserPhoneNumberStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets the telephone number for the specified user.
     * @param user The user whose telephone number should be set.
     * @param phoneNumber The telephone number to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setPhoneNumberAsync(user: TUser, phoneNumber: string | null, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Gets the telephone number, if any, for the specified user.
     * @param user The user whose telephone number should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user's telephone number, if any.
     */
    getPhoneNumberAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Gets a flag indicating whether the specified user's telephone number has been confirmed.
     * @param user The user to return a flag for, indicating whether their telephone number is confirmed.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise returning true if the specified user has a confirmed telephone number otherwise false.
     */
    getPhoneNumberConfirmedAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean>;

    /**
     * Sets a flag indicating if the specified user's phone number has been confirmed.
     * @param user The user whose telephone number confirmation status should be set.
     * @param confirmed A flag indicating whether the user's telephone number has been confirmed.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setPhoneNumberConfirmedAsync(user: TUser, confirmed: boolean, cancellationToken: CancellationToken): Promise<void>;
}

