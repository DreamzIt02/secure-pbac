// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/// <summary>
/// AuthenticationSchemes assign a name to a specific IAuthenticationHandler handlerType.
/// </summary>
export class AuthenticationScheme {
    /// <summary>
    /// The name of the authentication scheme.
    /// </summary>
    public name: string;

    /// <summary>
    /// The display name for the scheme. Null is valid and used for non user facing schemes.
    /// </summary>
    public displayName: string | null;

    /// <summary>
    /// The IAuthenticationHandler type that handles this scheme.
    /// </summary>
    public handlerType: Function;

    /// <summary>
    /// Initializes a new instance of AuthenticationScheme.
    /// </summary>
    constructor(name: string, displayName: string | null, handlerType: Function) {
        if (name == null) {
            throw new Error("ArgumentNullException: name");
        }
        if (handlerType == null) {
            throw new Error("ArgumentNullException: handlerType");
        }
        // In C#, typeof(IAuthenticationHandler).IsAssignableFrom(handlerType) is checked.
        // Here we preserve symmetry by keeping the validation stub.
        if (typeof handlerType !== "function") {
            throw new Error("ArgumentException: handlerType must implement IAuthenticationHandler.");
        }

        this.name = name;
        this.handlerType = handlerType;
        this.displayName = displayName;
    }
}
