

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";
import { UserLoginInfo } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for storing information that maps external login information provided
 * by Microsoft Account, Facebook etc. to a user account.
 * @typeparam TUser The type that represents a user.
 */
export interface IUserLoginStore<TUser> extends IUserStore<TUser> {
    /**
     * Adds an external UserLoginInfo to the specified user.
     * @param user The user to add the login to.
     * @param login The external UserLoginInfo to add to the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    addLoginAsync(
        user: TUser,
        login: UserLoginInfo,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Attempts to remove the provided login information from the specified user
     * and returns a flag indicating whether the removal succeeded or not.
     * @param user The user to remove the login information from.
     * @param loginProvider The login provider whose information should be removed.
     * @param providerKey The key given by the external login provider for the specified user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeLoginAsync(
        user: TUser,
        loginProvider: string,
        providerKey: string,
        cancellationToken: CancellationToken
    ): Promise<void>;

    /**
     * Retrieves the associated logins for the specified user.
     * @param user The user whose associated logins to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing a list of UserLoginInfo for the specified user, if any.
     */
    getLoginsAsync(
        user: TUser,
        cancellationToken: CancellationToken
    ): Promise<UserLoginInfo[]>;

    /**
     * Retrieves the user associated with the specified login provider and login provider key.
     * @param loginProvider The login provider who provided the providerKey.
     * @param providerKey The key provided by the loginProvider to identify a user.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user, if any, which matched the specified login provider and key.
     */
    findByLoginAsync(
        loginProvider: string,
        providerKey: string,
        cancellationToken: CancellationToken
    ): Promise<TUser | null>;
}

export class DefaultUserLoginStore<TUser> implements IUserLoginStore<TUser> {
    addLoginAsync(user: TUser, login: UserLoginInfo, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeLoginAsync(user: TUser, loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getLoginsAsync(user: TUser, cancellationToken: CancellationToken): Promise<UserLoginInfo[]> {
        throw new Error("Method not implemented.");
    }
    findByLoginAsync(loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<TUser | null> {
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