// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { IdentityRole } from "../../types/index.js";
import { IQueryable } from "../queryable.js";
import { IRoleStore } from "../role-stores/role.store.js";

/// <summary>
/// Provides an abstraction for querying roles in a Role store.
/// </summary>
/// <typeparam name="TRole">The type encapsulating a role.</typeparam>
export interface IQueryableRoleStore<TRole extends IdentityRole> extends IRoleStore<TRole> {
    /// <summary>
    /// Returns a queryable collection of roles.
    /// </summary>
    /// <value>A queryable collection of roles.</value>
    roles: IQueryable<TRole>;
}
