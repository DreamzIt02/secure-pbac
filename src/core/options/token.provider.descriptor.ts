// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

/// <summary>
/// Used to represents a token provider in TokenOptions's TokenMap.
/// </summary>
export class TokenProviderDescriptor {
    // Provides support for multiple TUser types at once.
    // See MapIdentityApiTests.CanAddEndpointsToMultipleRouteGroupsForMultipleUsersTypes for example usage.
    private readonly _providerTypes: Type[] = [];

    /// <summary>
    /// Initializes a new instance of the TokenProviderDescriptor class.
    /// </summary>
    /// <param name="type">The concrete type for this token provider.</param>
    constructor(type: Type) {
        this._providerTypes.push(type);
    }

    /// <summary>
    /// The type that will be used for this token provider.
    /// </summary>
    public get ProviderType(): Type {
        return this._providerTypes[this._providerTypes.length - 1];
    }

    /// <summary>
    /// If specified, the instance to be used for the token provider.
    /// </summary>
    public ProviderInstance?: object;

    addProviderType(type: Type): void {
        this._providerTypes.push(type);
    }

    getProviderType<T>(): Type | null {
        for (const providerType of this._providerTypes) {
            if (this.isAssignableFrom<T>(providerType)) {
                return providerType;
            }
        }
        return null;
    }

    /// <summary>
    /// Helper to simulate typeof(T).IsAssignableFrom(providerType).
    /// </summary>
    private isAssignableFrom<T>(providerType: Type): boolean {
        // In TypeScript, runtime type assignability is not directly available.
        // This is a stub for symmetry with C#.
        return true;
    }
}

/// <summary>
/// Represents a .NET-like Type placeholder for symmetry.
/// </summary>
export type Type = Function;
