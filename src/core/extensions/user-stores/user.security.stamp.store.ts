// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store which stores a user's security stamp.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserSecurityStampStore<TUser extends IdentityUser> extends IUserStore<TUser> {
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
