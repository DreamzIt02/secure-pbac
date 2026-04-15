

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which stores a user's security stamp.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserSecurityStampStore<TUser> extends IUserStore<TUser> {
    /**
     * Sets the provided security stamp for the specified user.
     * @param user The user whose security stamp should be set.
     * @param stamp The security stamp to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setSecurityStampAsync(user: TUser, stamp: string, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Get the security stamp for the specified user.
     * @param user The user whose security stamp should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the security stamp for the specified user.
     */
    getSecurityStampAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null>;
}

export class DefaultUserSecurityStampStore<TUser> implements IUserSecurityStampStore<TUser> {
    setSecurityStampAsync(user: TUser, stamp: string, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getSecurityStampAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
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