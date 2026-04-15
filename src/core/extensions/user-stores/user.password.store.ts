

import { AllowedPrimaryKeysSafe } from "../../../contexts/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store containing users' password hashes.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserPasswordStore<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> extends IUserStore<TUser> {
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

export class DefaultUserPasswordStore<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserPasswordStore<TKey, TUser> {
    setPasswordHashAsync(user: TUser, passwordHash: string | null, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getPasswordHashAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
        throw new Error("Method not implemented.");
    }
    hasPasswordAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean> {
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