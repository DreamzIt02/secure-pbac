

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for storing information which can be used to implement account lockout,
 * including access failures and lockout status.
 * @typeparam TUser The type that represents a user.
 */
export interface IUserLockoutStore<TUser> extends IUserStore<TUser> {
    /**
     * Gets the last DateTimeOffset a user's last lockout expired, if any.
     * Any time in the past should indicate a user is not locked out.
     * @param user The user whose lockout date should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the last time a user's lockout expired, if any.
     */
    getLockoutEndDateAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<Date | null>;

    /**
     * Locks out a user until the specified end date has passed.
     * Setting an end date in the past immediately unlocks a user.
     * @param user The user whose lockout date should be set.
     * @param lockoutEnd The Date after which the user's lockout should end.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setLockoutEndDateAsync(
        user: TUser,
        lockoutEnd: Date | null,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Records that a failed access has occurred, incrementing the failed access count.
     * @param user The user whose failed access count should be incremented.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the incremented failed access count.
     */
    incrementAccessFailedCountAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<number>;

    /**
     * Resets a user's failed access count.
     * This is typically called after the account is successfully accessed.
     * @param user The user whose failed access count should be reset.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    resetAccessFailedCountAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Retrieves the current failed access count for the specified user.
     * @param user The user whose failed access count should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the failed access count.
     */
    getAccessFailedCountAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<number>;

    /**
     * Retrieves a flag indicating whether user lockout can be enabled for the specified user.
     * @param user The user whose ability to be locked out should be returned.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing true if a user can be locked out, otherwise false.
     */
    getLockoutEnabledAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<boolean>;

    /**
     * Sets the flag indicating if the specified user can be locked out.
     * @param user The user whose ability to be locked out should be set.
     * @param enabled A flag indicating if lockout can be enabled for the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setLockoutEnabledAsync(
        user: TUser,
        enabled: boolean,
        cancellationToken: CancellationToken
    ): Promise<void>;
}

export class DefaultUserLockoutStore<TUser> implements IUserLockoutStore<TUser> {
    getLockoutEndDateAsync(user: TUser, cancellationToken: CancellationToken): Promise<Date | null> {
        throw new Error("Method not implemented.");
    }
    setLockoutEndDateAsync(user: TUser, lockoutEnd: Date | null, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    incrementAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken): Promise<number> {
        throw new Error("Method not implemented.");
    }
    resetAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken): Promise<number> {
        throw new Error("Method not implemented.");
    }
    getLockoutEnabledAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    setLockoutEnabledAsync(user: TUser, enabled: boolean, cancellationToken: CancellationToken): Promise<void> {
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