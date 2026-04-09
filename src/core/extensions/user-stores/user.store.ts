// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { AsyncLocalStorage } from "async_hooks";
import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityErrorCode } from "../../../types/error.codes.js";
import { IdentityError, IdentityResult } from "../../identity/index.js";
import { IIdentityResult } from "../../identity/types.js";
import { IdentityUser } from "../../types/index.js";
import { ILookupNormalizer, LookupNormalizer } from "../lookup.normalizer.js";

// interface TUser extends IdentityUser {

// }
/**
 * Provides an abstraction for a store which manages user accounts.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserStore<TUser extends IdentityUser> extends Disposable {
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

/**
 * Default Node.js in-memory implementation of TUserStore<TUser>.
 * This is a simple store backed by a Map, suitable for testing or prototyping.
 */
export class InMemoryUserStore<TUser extends IdentityUser = IdentityUser> implements IUserStore<TUser> {
  [Symbol.dispose](): void {
      throw new Error("Method not implemented.");
  }

  private users: Map<string, TUser> = new Map();
  private static lookupNormalizer: ILookupNormalizer = new LookupNormalizer();

  async getUserIdAsync(user: TUser, cancellationToken: CancellationToken): Promise<string> {
    cancellationToken.throwIfCancellationRequested();
    return user.id;
  }

  async getUserNameAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    return user.userName ?? null;
  }

  async setUserNameAsync(user: TUser, userName: string | null, cancellationToken: CancellationToken): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    user.userName = userName ?? null;
  }

  async createAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (this.users.has(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.Exist, "User already exists."));
    }
    this.users.set(user.id, user);
    return IdentityResult.success();
  }

  async updateAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (!this.users.has(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.NotFound, "User not found."));
    }
    this.users.set(user.id, user);
    return IdentityResult.success();
  }

  async deleteAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (!this.users.delete(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.NotFound, "User not found."));
    }
    return IdentityResult.success();
  }

  async findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TUser | null> {
    cancellationToken.throwIfCancellationRequested();
    return this.users.get(userId) ?? null;
  }

  async findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TUser | null> {
    cancellationToken.throwIfCancellationRequested();
    for (const user of this.users.values()) {
      if (user.userName === normalizedUserName || 
        InMemoryUserStore.lookupNormalizer.normalizeName(user.userName) === normalizedUserName) {
        return user;
      }
    }
    return null;
  }

  dispose(): void {
    this.users.clear();
  }
}

/**
 * Node.js AsyncLocalStorage-based implementation of TUserStore<TUser>.
 * This keeps a user store bound to the current async execution context,
 * similar to how ASP.NET Core uses AsyncLocal<T>.
 */
export class AsyncLocalUserStore<TUser extends IdentityUser = IdentityUser> implements IUserStore<TUser> {
  [Symbol.dispose](): void {
      throw new Error("Method not implemented.");
  }

  private static storage = new AsyncLocalStorage<Map<string, IdentityUser>>();
  private static lookupNormalizer: ILookupNormalizer = new LookupNormalizer();

  /**
   * Runs a callback within a new AsyncLocalStorage scope.
   */
  static runWithStore<T>(callback: () => T): T {
    return this.storage.run(new Map<string, IdentityUser>(), callback);
  }

  private get store(): Map<string, IdentityUser> {
    const current = AsyncLocalUserStore.storage.getStore();
    if (!current) {
      throw new Error("No AsyncLocalStorage context is available. Use AsyncLocalUserStore.runWithStore().");
    }
    return current;
  }

  async getUserIdAsync(user: TUser, cancellationToken: CancellationToken): Promise<string> {
    cancellationToken.throwIfCancellationRequested();
    return user.id;
  }

  async getUserNameAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    return user.userName ?? null;
  }

  async setUserNameAsync(user: TUser, userName: string | null, cancellationToken: CancellationToken): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    user.userName = userName ?? null;
  }

  async createAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (this.store.has(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.Exist, "User already exists."));
    }
    this.store.set(user.id, user);
    return IdentityResult.success();
  }

  async updateAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (!this.store.has(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.NotFound, "User not found."));
    }
    this.store.set(user.id, user);
    return IdentityResult.success();
  }

  async deleteAsync(user: TUser, cancellationToken: CancellationToken): Promise<IIdentityResult> {
    cancellationToken.throwIfCancellationRequested();
    if (!this.store.delete(user.id)) {
      return IdentityResult.failed(new IdentityError(IdentityErrorCode.NotFound, "User not found."));
    }
    return IdentityResult.success();
  }

  async findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TUser | null> {
    cancellationToken.throwIfCancellationRequested();
    return (this.store.get(userId) ?? null) as TUser;
  }

  async findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TUser | null> {
    cancellationToken.throwIfCancellationRequested();
    for (const user of this.store.values()) {
      if (user.userName === normalizedUserName || 
        AsyncLocalUserStore.lookupNormalizer.normalizeName(user.userName) === normalizedUserName) {
        return user as TUser;
      }
    }
    return null;
  }

  dispose(): void {
    this.store.clear();
  }
}
