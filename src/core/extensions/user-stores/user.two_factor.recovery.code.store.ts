

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which stores a user's recovery codes.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserTwoFactorRecoveryCodeStore<TUser> extends IUserStore<TUser> {
    /**
     * Updates the recovery codes for the user while invalidating any previous recovery codes.
     * @param user The user to store new recovery codes for.
     * @param recoveryCodes The new recovery codes for the user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    replaceCodesAsync(
        user: TUser,
        recoveryCodes: Iterable<string>,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Returns whether a recovery code is valid for a user. Note: recovery codes are only valid
     * once, and will be invalid after use.
     * @param user The user who owns the recovery code.
     * @param code The recovery code to use.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing true if the recovery code was found for the user.
     */
    redeemCodeAsync(
        user: TUser,
        code: string,
        cancellationToken: CancellationToken
    ): Promise<boolean>;

    /**
     * Returns how many recovery codes are still valid for a user.
     * @param user The user who owns the recovery code.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the number of valid recovery codes for the user.
     */
    countCodesAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<number>;
}

export class DefaultTwoFactorRecoveryCodeStore<TUser> implements IUserTwoFactorRecoveryCodeStore<TUser> {
    replaceCodesAsync(user: TUser, recoveryCodes: Iterable<string>, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    redeemCodeAsync(user: TUser, code: string, cancellationToken: CancellationToken): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    countCodesAsync(user: TUser, cancellationToken: CancellationToken): Promise<number> {
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