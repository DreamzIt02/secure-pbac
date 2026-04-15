

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which stores info about user's authenticator.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserAuthenticatorKeyStore<TUser> extends IUserStore<TUser> {
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

export class DefaultAuthenticatorKeyStore<TUser> implements IUserAuthenticatorKeyStore<TUser> {
    setAuthenticatorKeyAsync(user: TUser, key: string, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAuthenticatorKeyAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
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