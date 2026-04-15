

import { IdentityRole } from "../../types/index.js";
import { IQueryable } from "../../../linq/queryable.js";
import { IRoleStore } from "../role-stores/role.store.js";
import { AllowedPrimaryKeysSafe } from "../../../contexts/index.js";

/// <summary>
/// Provides an abstraction for querying roles in a Role store.
/// </summary>
/// <typeparam name="TRole">The type encapsulating a role.</typeparam>
export interface IQueryableRoleStore<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> extends IRoleStore<TKey, TRole> {
    /// <summary>
    /// Returns a queryable collection of roles.
    /// </summary>
    /// <value>A queryable collection of roles.</value>
    roles: IQueryable<TRole>;
}
