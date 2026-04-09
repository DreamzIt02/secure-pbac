// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { IdentityUser } from "../../types/index.js";
import { IQueryable } from "../queryable.js";
import { IUserStore } from "../user-stores/index.js";

/**
 * Provides an abstraction for querying users in a User store.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IQueryableUserStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Returns a collection of users.
     * @value A collection of users.
     */
    users: IQueryable<TUser>;
}
