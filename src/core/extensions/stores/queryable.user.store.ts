

import { IQueryable } from "../../../linq/queryable.js";
import { IUserStore } from "../user-stores/index.js";

/**
 * Provides an abstraction for querying users in a User store.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IQueryableUserStore<TUser> extends IUserStore<TUser> {
    /**
     * Returns a collection of users.
     * @value A collection of users.
     */
    users: IQueryable<TUser>;
}
