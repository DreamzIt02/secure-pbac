// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/// <summary>
/// Represents login information and source for a user record.
/// </summary>
export class UserLoginInfo {
    /// <summary>
    /// Creates a new instance of UserLoginInfo
    /// </summary>
    constructor(loginProvider: string, providerKey: string, providerDisplayName: string | null) {
        this.loginProvider = loginProvider;
        this.providerKey = providerKey;
        this.providerDisplayName = providerDisplayName;
    }

    /// <summary>
    /// Gets or sets the provider for this instance of UserLoginInfo.
    /// </summary>
    /// <remarks>
    /// Examples of the provider may be Local, Facebook, Google, etc.
    /// </remarks>
    public loginProvider: string;

    /// <summary>
    /// Gets or sets the unique identifier for the user identity user provided by the login provider.
    /// </summary>
    /// <remarks>
    /// This would be unique per provider, examples may be @microsoft as a Twitter provider key.
    /// </remarks>
    public providerKey: string;

    /// <summary>
    /// Gets or sets the display name for the provider.
    /// </summary>
    /// <remarks>
    /// Examples of the display name may be local, FACEBOOK, Google, etc.
    /// </remarks>
    public providerDisplayName: string | null;
}
