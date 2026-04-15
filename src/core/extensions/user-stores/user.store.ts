

import { CancellationToken } from "../../../types/cancellation.js";
import { IIdentityResult } from "../../identity/types.js";

/// <summary>
/// Marker interface used to signal that the store supports the <see cref="StoreOptions.ProtectPersonalData"/> flag.
/// </summary>
/// <typeparam name="TUser">The type that represents a user.</typeparam>
export interface IProtectedUserStore<TUser> extends IUserStore<TUser> { }

/**
 * Provides an abstraction for a store which manages user accounts.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserStore<TUser> extends Disposable {
    /**
     * Gets the user identifier for the specified user.
     * @param user The user whose identifier should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the identifier for the specified user.
     */
    getUserIdAsync(user: TUser, cancellationToken: CancellationToken): Promise<string>;

    /**
     * Gets the user name for the specified user.
     * @param user The user whose name should be retrieved.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the name for the specified user.
     */
    getUserNameAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null>;

    /**
     * Sets the given userName for the specified user.
     * @param user The user whose name should be set.
     * @param userName The user name to set.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    setUserNameAsync(user: TUser, userName: string | null, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Creates the specified user in the user store.
     * @param user The user to create.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the IdentityResult of the creation operation.
     */
    createAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Updates the specified user in the user store.
     * @param user The user to update.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the IdentityResult of the update operation.
     */
    updateAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Deletes the specified user from the user store.
     * @param user The user to delete.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the IdentityResult of the delete operation.
     */
    deleteAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult>;

    /**
     * Finds and returns a user, if any, who has the specified userId.
     * @param userId The user ID to search for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user matching the specified userId if it exists.
     */
    findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TUser | null>;

    /**
     * Finds and returns a user, if any, who has the specified normalized user name.
     * @param normalizedUserName The normalized user name to search for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise containing the user matching the specified normalizedUserName if it exists.
     */
    findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TUser | null>;
}
