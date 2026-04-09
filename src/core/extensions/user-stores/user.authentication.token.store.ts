// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction to store a user's authentication tokens.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserAuthenticationTokenStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Sets the token value for a particular user.
     * @param user The user.
     * @param loginProvider The authentication provider for the token.
     * @param name The name of the token.
     * @param value The value of the token.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setTokenAsync(
        user: TUser,
        loginProvider: string,
        name: string,
        value: string | null,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Deletes a token for a user.
     * @param user The user.
     * @param loginProvider The authentication provider for the token.
     * @param name The name of the token.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeTokenAsync(
        user: TUser,
        loginProvider: string,
        name: string,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Returns the token value.
     * @param user The user.
     * @param loginProvider The authentication provider for the token.
     * @param name The name of the token.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    getTokenAsync(
        user: TUser,
        loginProvider: string,
        name: string,
        cancellationToken: CancellationToken
    ): Promise<string | null>;
}
