

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store containing users' telephone numbers.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserPhoneNumberStore<TUser> extends IUserStore<TUser> {
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

export class DefaultUserPhoneNumberStore<TUser> implements IUserPhoneNumberStore<TUser> {
    setPhoneNumberAsync(user: TUser, phoneNumber: string | null, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getPhoneNumberAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
        throw new Error("Method not implemented.");
    }
    getPhoneNumberConfirmedAsync(user: TUser, cancellationToken: CancellationToken): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    setPhoneNumberConfirmedAsync(user: TUser, confirmed: boolean, cancellationToken: CancellationToken): Promise<void> {
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