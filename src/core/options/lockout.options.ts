// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/**
 * Options for configuring user lockout.
 */
export class LockoutOptions {
    /**
     * Gets or sets a flag indicating whether a new user can be locked out. Defaults to true.
     * True if a newly created user can be locked out, otherwise false.
     */
    allowedForNewUsers: boolean = true;

    /**
     * Gets or sets the number of failed access attempts allowed before a user is locked out,
     * assuming lock out is enabled. Defaults to 5.
     * The number of failed access attempts allowed before a user is locked out, if lockout is enabled.
     */
    maxFailedAccessAttempts: number = 5;

    /**
     * Gets or sets the time a user is locked out for when a lockout occurs. Defaults to 5 minutes.
     * The time a user is locked out for when a lockout occurs.
     */
    defaultLockoutTimeSpan: number = 5 * 60 * 1000; // milliseconds (5 minutes)
}
