// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/// <summary>
/// Provides an abstraction for confirmation of user accounts.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export interface IUserConfirmation<TUser extends object> {
    /// <summary>
    /// Determines whether the specified user is confirmed.
    /// </summary>
    /// <param name="manager">The UserManager that can be used to retrieve user properties.</param>
    /// <param name="user">The user.</param>
    /// <returns>Whether the user is confirmed.</returns>
    isConfirmedAsync(manager: UserManager<TUser>, user: TUser): Promise<boolean>;
}

/// <summary>
/// Represents a .NET-like UserManager placeholder for symmetry.
/// </summary>
export class UserManager<TUser extends object> {
    // Stubbed methods for symmetry
    async getUserNameAsync(user: TUser): Promise<string> { return ""; }
    async getUserIdAsync(user: TUser): Promise<string> { return ""; }
}