// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { ClaimsPrincipal } from "../../claims/index.js";
import { AuthenticationProperties, AuthenticationToken } from "../../http/authentication/index.js";
import { UserLoginInfo } from "./user.login.info.js";

/// <summary>
/// Represents login information, source and externally source principal for a user record
/// </summary>
export class ExternalLoginInfo extends UserLoginInfo {
    /// <summary>
    /// Creates a new instance of ExternalLoginInfo
    /// </summary>
    constructor(principal: ClaimsPrincipal, loginProvider: string, providerKey: string, displayName: string) {
        super(loginProvider, providerKey, displayName);
        this.principal = principal;
    }

    /// <summary>
    /// Gets or sets the ClaimsPrincipal associated with this login.
    /// </summary>
    public principal: ClaimsPrincipal;

    /// <summary>
    /// The AuthenticationTokens associated with this login.
    /// </summary>
    public authenticationTokens: AuthenticationToken[] | null = null;

    /// <summary>
    /// The AuthenticationProperties associated with this login.
    /// </summary>
    public authenticationProperties: AuthenticationProperties | null = null;
}
