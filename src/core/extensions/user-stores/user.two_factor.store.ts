

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction to store a flag indicating whether a user has two factor authentication enabled.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserTwoFactorStore<TUser> extends IUserStore<TUser> {
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

export class DefaultUserTwoFactorStore<TUser> implements IUserTwoFactorStore<TUser> {
    setTwoFactorEnabledAsync(user: TUser, enabled: boolean, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getTwoFactorEnabledAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean> {
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