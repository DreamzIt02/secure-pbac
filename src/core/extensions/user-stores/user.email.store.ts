// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for the storage and management of user email addresses.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserEmailStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets the email address for a user.
     * @param user The user whose email should be set.
     * @param email The email to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setEmailAsync(user: TUser, email: string | null, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Gets the email address for the specified user.
     * @param user The user whose email should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the email address for the specified user.
     */
    getEmailAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Gets a flag indicating whether the email address for the specified user has been verified.
     * @param user The user whose email confirmation status should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a flag indicating whether the email address for the specified user has been confirmed.
     */
    getEmailConfirmedAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean>;

    /**
     * Sets the flag indicating whether the specified user's email address has been confirmed.
     * @param user The user whose email confirmation status should be set.
     * @param confirmed A flag indicating if the email address has been confirmed.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setEmailConfirmedAsync(user: TUser, confirmed: boolean, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Gets the user, if any, associated with the specified normalized email address.
     * @param normalizedEmail The normalized email address to return the user for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user if any associated with the specified normalized email address.
     */
    findByEmailAsync(normalizedEmail: string, cancellationToken: CancellationToken): Promise<TUser | null>;

    /**
     * Returns the normalized email for the specified user.
     * @param user The user whose email address to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the normalized email address if any associated with the specified user.
     */
    getNormalizedEmailAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Sets the normalized email for the specified user.
     * @param user The user whose email address to set.
     * @param normalizedEmail The normalized email to set for the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setNormalizedEmailAsync(user: TUser, normalizedEmail: string | null, cancellationToken: CancellationToken): Promise<void>;
}

