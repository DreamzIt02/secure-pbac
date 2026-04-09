import { ClaimsPrincipal } from "../../claims/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { AuthenticationProperties } from "./authentication.properties.js";

/**
 * Contains user identity information as well as additional authentication state.
 *
 * This class represents an authentication ticket, which encapsulates:
 * - The authenticated user (`ClaimsPrincipal`)
 * - The authentication scheme responsible for issuing the ticket
 * - Additional state values (`AuthenticationProperties`)
 *
 * Example usage:
 * ```ts
 * const principal = new ClaimsPrincipal([new ClaimsIdentity("user1")]);
 * const ticket = new AuthenticationTicket(principal, "MyScheme");
 * console.log(ticket.authenticationScheme); // "MyScheme"
 * console.log(ticket.principal.identities.length); // 1
 * ```
 */
export class AuthenticationTicket {
  /**
   * Gets the authentication scheme that was responsible for this ticket.
   */
  public readonly authenticationScheme: string;

  /**
   * Gets the claims principal with authenticated user identities.
   */
  public readonly principal: ClaimsPrincipal;

  /**
   * Additional state values for the authentication session.
   */
  public readonly properties: AuthenticationProperties;

  /**
   * Initializes a new instance of the `AuthenticationTicket` class.
   *
   * @param principal The `ClaimsPrincipal` that represents the authenticated user.
   * @param properties Additional properties that can be consumed by the user or runtime.
   * @param authenticationScheme The authentication scheme that was responsible for this ticket.
   */
  constructor(principal: ClaimsPrincipal, properties: AuthenticationProperties | null, authenticationScheme: string) {
    ArgumentNullThrowHelper.throwIfNull(principal)

    this.authenticationScheme = authenticationScheme;
    this.principal = principal;
    this.properties = properties ?? new AuthenticationProperties();
  }

  /**
   * Initializes a new instance of the `AuthenticationTicket` class with only principal and scheme.
   *
   * @param principal The `ClaimsPrincipal` that represents the authenticated user.
   * @param authenticationScheme The authentication scheme that was responsible for this ticket.
   */
  static fromPrincipal(principal: ClaimsPrincipal, authenticationScheme: string): AuthenticationTicket {
    return new AuthenticationTicket(principal, null, authenticationScheme);
  }

  /**
   * Returns a copy of the ticket.
   *
   * The method clones the `principal` by calling `ClaimsIdentity.clone()` on each of the
   * `ClaimsPrincipal.identities`.
   *
   * @returns A copy of the ticket.
   */
  clone(): AuthenticationTicket {
    const clonedPrincipal = new ClaimsPrincipal();
    for (const identity of this.principal.identities) {
      clonedPrincipal.addIdentity(identity.clone());
    }
    return new AuthenticationTicket(clonedPrincipal, this.properties.clone(), this.authenticationScheme);
  }
}

