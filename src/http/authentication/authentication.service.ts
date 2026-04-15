

import { ClaimsPrincipal } from "../../claims/index.js";
import { HttpContext } from "../http.context.js";
import { AuthenticateResult } from "./authenticate.result.js";
import { AuthenticationProperties } from "./authentication.properties.js";

/**
 * Used to provide authentication.
 */
export interface IAuthenticationService {
  /**
   * Authenticate for the specified authentication scheme.
   * @param context The HttpContext.
   * @param scheme The name of the authentication scheme.
   * @returns The result.
   */
  authenticateAsync(context: HttpContext, scheme: string | null): Promise<AuthenticateResult>;

  /**
   * Challenge the specified authentication scheme.
   * An authentication challenge can be issued when an unauthenticated user requests an endpoint that requires authentication.
   * @param context The HttpContext.
   * @param scheme The name of the authentication scheme.
   * @param properties The AuthenticationProperties.
   * @returns A task.
   */
  challengeAsync(context: HttpContext, scheme: string | null, properties: AuthenticationProperties | null): Promise<void>;

  /**
   * Forbids the specified authentication scheme.
   * Forbid is used when an authenticated user attempts to access a resource they are not permitted to access.
   * @param context The HttpContext.
   * @param scheme The name of the authentication scheme.
   * @param properties The AuthenticationProperties.
   * @returns A task.
   */
  forbidAsync(context: HttpContext, scheme: string | null, properties: AuthenticationProperties | null): Promise<void>;

  /**
   * Sign a principal in for the specified authentication scheme.
   * @param context The HttpContext.
   * @param scheme The name of the authentication scheme.
   * @param principal The ClaimsPrincipal to sign in.
   * @param properties The AuthenticationProperties.
   * @returns A task.
   */
  signInAsync(context: HttpContext, scheme: string | null, principal: ClaimsPrincipal, properties: AuthenticationProperties | null): Promise<void>;

  /**
   * Sign out the specified authentication scheme.
   * @param context The HttpContext.
   * @param scheme The name of the authentication scheme.
   * @param properties The AuthenticationProperties.
   * @returns A task.
   */
  signOutAsync(context: HttpContext, scheme: string | null, properties: AuthenticationProperties | null): Promise<void>;
}

// FIXME: Implement AuthenticationService
export class AuthenticationService implements IAuthenticationService { }