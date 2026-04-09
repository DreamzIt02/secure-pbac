// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/// <summary>
/// Represents all the options we can use to configure the cookies middleware used by the identity system.
/// </summary>
export class IdentityConstants {
    private static readonly IdentityPrefix: string = "Identity";

    /// <summary>
    /// The scheme used to identify application authentication cookies.
    /// </summary>
    public static readonly ApplicationScheme: string = IdentityConstants.IdentityPrefix + ".Application";

    /// <summary>
    /// The scheme used to identify bearer authentication tokens.
    /// </summary>
    public static readonly BearerScheme: string = IdentityConstants.IdentityPrefix + ".Bearer";

    /// <summary>
    /// The scheme used to identify combination of BearerScheme and ApplicationScheme.
    /// </summary>
    static readonly BearerAndApplicationScheme: string = IdentityConstants.IdentityPrefix + ".BearerAndApplication";

    /// <summary>
    /// The scheme used to identify external authentication cookies.
    /// </summary>
    public static readonly ExternalScheme: string = IdentityConstants.IdentityPrefix + ".External";

    /// <summary>
    /// The scheme used to identify Two Factor authentication cookies for saving the Remember Me state.
    /// </summary>
    public static readonly TwoFactorRememberMeScheme: string = IdentityConstants.IdentityPrefix + ".TwoFactorRememberMe";

    /// <summary>
    /// The scheme used to identify Two Factor authentication cookies for round tripping user identities.
    /// </summary>
    public static readonly TwoFactorUserIdScheme: string = IdentityConstants.IdentityPrefix + ".TwoFactorUserId";
}
