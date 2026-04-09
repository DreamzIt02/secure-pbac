// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { AuthenticationScheme } from "./authentication.scheme.js";

/// <summary>
/// Responsible for managing what authenticationSchemes are supported.
/// </summary>
export interface IAuthenticationSchemeProvider {
    /// <summary>
    /// Returns all currently registered AuthenticationSchemes.
    /// </summary>
    getAllSchemesAsync(): Promise<AuthenticationScheme[]>;

    /// <summary>
    /// Returns the AuthenticationScheme matching the name, or null.
    /// </summary>
    getSchemeAsync(name: string): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Returns the scheme that will be used by default for AuthenticateAsync.
    /// </summary>
    getDefaultAuthenticateSchemeAsync(): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Returns the scheme that will be used by default for ChallengeAsync.
    /// </summary>
    getDefaultChallengeSchemeAsync(): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Returns the scheme that will be used by default for ForbidAsync.
    /// </summary>
    getDefaultForbidSchemeAsync(): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Returns the scheme that will be used by default for SignInAsync.
    /// </summary>
    getDefaultSignInSchemeAsync(): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Returns the scheme that will be used by default for SignOutAsync.
    /// </summary>
    getDefaultSignOutSchemeAsync(): Promise<AuthenticationScheme | null>;

    /// <summary>
    /// Registers a scheme for use by IAuthenticationService.
    /// </summary>
    addScheme(scheme: AuthenticationScheme): void;

    /// <summary>
    /// Registers a scheme for use by IAuthenticationService.
    /// Returns true if the scheme was added successfully.
    /// </summary>
    tryAddScheme(scheme: AuthenticationScheme): boolean;

    /// <summary>
    /// Removes a scheme, preventing it from being used by IAuthenticationService.
    /// </summary>
    removeScheme(name: string): void;

    /// <summary>
    /// Returns the schemes in priority order for request handling.
    /// </summary>
    getRequestHandlerSchemesAsync(): Promise<AuthenticationScheme[]>;
}
