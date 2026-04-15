
/// <summary>
/// Created per request to handle authentication for a particular scheme.

import { HttpContext } from "../http.context.js";
import { AuthenticateResult } from "./authenticate.result.js";
import { AuthenticationProperties } from "./authentication.properties.js";
import { AuthenticationScheme } from "./authentication.scheme.js";

/// </summary>
export interface IAuthenticationHandler
{
    /// <summary>
    /// Initialize the authentication handler. The handler should initialize anything it needs from the request and scheme as part of this method.
    /// </summary>
    /// <param name="scheme">The <see cref="AuthenticationScheme"/> scheme.</param>
    /// <param name="context">The <see cref="HttpContext"/> context for the current request.</param>
    initializeAsync(scheme: AuthenticationScheme, context: HttpContext): Promise<void>;

    /// <summary>
    /// Authenticate the current request.
    /// </summary>
    /// <returns>The <see cref="AuthenticateResult"/> result.</returns>
    authenticateAsync(): Promise<AuthenticateResult>;

    /// <summary>
    /// Challenge the current request.
    /// </summary>
    /// <param name="properties">The <see cref="AuthenticationProperties"/> that contains the extra meta-data arriving with the authentication.</param>
    challengeAsync(properties?: AuthenticationProperties): Promise<void>;

    /// <summary>
    /// Forbid the current request.
    /// </summary>
    /// <param name="properties">The <see cref="AuthenticationProperties"/> that contains the extra meta-data arriving with the authentication.</param>
    forbidAsync(properties?: AuthenticationProperties): Promise<void>;
}

export class DefaultAuthenticationHandler implements IAuthenticationHandler {
  async initializeAsync(scheme: AuthenticationScheme, context: HttpContext): Promise<void> {
    console.warn("DefaultAuthenticationHandler.authenticateAsync called.");
  }

  async authenticateAsync(): Promise<AuthenticateResult> {
    console.warn("DefaultAuthenticationHandler.authenticateAsync called.");
    return AuthenticateResult.fail("Not implemented");
  }

  async challengeAsync(properties?: AuthenticationProperties): Promise<void> {
    console.warn("DefaultAuthenticationHandler.authenticateAsync called.");
  }

  async forbidAsync(properties?: AuthenticationProperties): Promise<void> {
    console.warn("DefaultAuthenticationHandler.authenticateAsync called.");
  }
}
