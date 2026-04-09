// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/**
 * Used for store specific options.
 */
export class StoreOptions {
    /**
     * If set to a positive number, the default OnModelCreating will use this value as the max length for any
     * properties used as keys, i.e. UserId, LoginProvider, ProviderKey.
     */
    maxLengthForKeys: number = 0;

    /**
     * If set to true, the store must protect all personally identifying data for a user.
     * This will be enforced by requiring the store to implement IProtectedUserStore<TUser>.
     */
    protectPersonalData: boolean = false;

    /**
     * The schema version for the store, the default is 0.0 which leaves it up to the store
     * to determine what version should be used.
     */
    schemaVersion: Version = IdentitySchemaVersions.default;
}

/**
 * Represents a version number (mirroring System.Version).
 */
export class Version {
    constructor(public major: number, public minor: number) {}
}

/**
 * Identity schema versions placeholder.
 */
export class IdentitySchemaVersions {
    public static readonly default: Version = new Version(0, 0);
}
