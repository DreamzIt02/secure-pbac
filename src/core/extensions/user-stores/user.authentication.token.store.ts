

import { AllowedPrimaryKeysSafe } from "../../../contexts/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction to store a user's authentication tokens.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserAuthenticationTokenStore<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> extends IUserStore<TUser> {
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


export class DefaultUserAuthenticationTokenStore<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserAuthenticationTokenStore<TKey, TUser> {
    setTokenAsync(user: TUser, loginProvider: string, name: string, value: string | null, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<string | null> {
        throw new Error("Method not implemented.");
    }
    getUserIdAsync(user: TUser, cancellationToken: CancellationToken): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getUserNameAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
        throw new Error("Method not implemented.");
    }
    setUserNameAsync(user: TUser, userName: string | null, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    createAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
        throw new Error("Method not implemented.");
    }
    updateAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
        throw new Error("Method not implemented.");
    }
    deleteAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
        throw new Error("Method not implemented.");
    }
    findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TUser | null> {
        throw new Error("Method not implemented.");
    }
    findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TUser | null> {
        throw new Error("Method not implemented.");
    }
    [Symbol.dispose](): void {
        throw new Error("Method not implemented.");
    }
}