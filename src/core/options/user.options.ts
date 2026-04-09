// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/**
 * Options for user validation.
 */
export class UserOptions {
    /**
     * Gets or sets the list of allowed characters in the username used to validate user names.
     * Defaults to abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+
     * The list of allowed characters in the username used to validate user names.
     */
    allowedUserNameCharacters: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

    /**
     * Gets or sets a flag indicating whether the application requires unique emails for its users. Defaults to false.
     * True if the application requires each user to have their own, unique, not null, not blank email, otherwise false.
     */
    requireUniqueEmail: boolean = false;
}
