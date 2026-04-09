import { ClaimsPrincipal } from "../../claims/index.js";
import { AuthenticationFailureException } from "./authenticate.request.js";
import { AuthenticationProperties } from "./authentication.properties.js";
import { AuthenticationTicket } from "./authentication.ticket.js";

/**
 * Contains the result of an authentication call.
 *
 * This class represents whether authentication succeeded, failed, or returned no result.
 * It encapsulates the authentication ticket, principal, properties, and any failure information.
 */
export class AuthenticateResult {
  private static readonly _noResult = new AuthenticateResult({ none: true });

  /**
   * The authentication ticket produced by a successful authentication.
   */
  public ticket?: AuthenticationTicket;

  /**
   * Additional state values for the authentication session.
   */
  public properties?: AuthenticationProperties;

  /**
   * Holds failure information from the authentication.
   */
  public failure?: Error;

  /**
   * Indicates that there was no information returned for this authentication scheme.
   */
  public none: boolean;

  private constructor(init?: {
    ticket?: AuthenticationTicket;
    properties?: AuthenticationProperties;
    failure?: Error;
    none?: boolean;
  }) {
    this.ticket = init?.ticket;
    this.properties = init?.properties;
    this.failure = init?.failure;
    this.none = init?.none ?? false;
  }

  /**
   * True if authentication was successful.
   */
  get succeeded(): boolean {
    return this.ticket != null;
  }

  /**
   * Gets the claims principal with authenticated user identities.
   */
  get principal(): ClaimsPrincipal | undefined {
    return this.ticket?.principal;
  }

  /**
   * Create a deep copy of the result.
   */
  clone(): AuthenticateResult {
    if (this.none) {
      return AuthenticateResult.noResult();
    }
    if (this.failure) {
      return AuthenticateResult.fail(this.failure, this.properties?.clone());
    }
    if (this.succeeded && this.ticket) {
      return AuthenticateResult.success(this.ticket.clone());
    }
    throw new Error("NotImplementedException");
  }

  /**
   * Indicates that authentication was successful.
   *
   * @param ticket The ticket representing the authentication result.
   * @returns The result.
   */
  static success(ticket: AuthenticationTicket): AuthenticateResult {
    if (!ticket) throw new Error("ArgumentNullException: ticket");
    return new AuthenticateResult({ ticket, properties: ticket.properties });
  }

  /**
   * Indicates that there was no information returned for this authentication scheme.
   *
   * @returns The result.
   */
  static noResult(): AuthenticateResult {
    return AuthenticateResult._noResult;
  }

  // --- Overloads for Fail ---

  /**
   * Indicates that there was a failure during authentication.
   * @param failure The failure exception.
   */
  static fail(failure: Error): AuthenticateResult;

  /**
   * Indicates that there was a failure during authentication.
   * @param failure The failure exception.
   * @param properties Additional state values for the authentication session.
   */
  static fail(failure: Error, properties?: AuthenticationProperties): AuthenticateResult;

  /**
   * Indicates that there was a failure during authentication.
   * @param failureMessage The failure message.
   */
  static fail(failureMessage: string): AuthenticateResult;

  /**
   * Indicates that there was a failure during authentication.
   * @param failureMessage The failure message.
   * @param properties Additional state values for the authentication session.
   */
  static fail(failureMessage: string, properties?: AuthenticationProperties): AuthenticateResult;

  // Implementation of overloads
  static fail(
    failureOrMessage: Error | string,
    properties?: AuthenticationProperties
  ): AuthenticateResult {
    if (typeof failureOrMessage === "string") {
      return new AuthenticateResult({
        failure: new AuthenticationFailureException(failureOrMessage),
        properties,
      });
    }
    return new AuthenticateResult({ failure: failureOrMessage, properties });
  }
}

/**
 * Predefined authentication results for specific scenarios.
 * Mirrors the static classes in ASP.NET Core (Certificate, Cookies, JwtBearer).
 */
export namespace AuthenticateResults {
  // Certificate
  export const NoSelfSigned = AuthenticateResult.fail("Options do not allow self signed certificates.");
  export const NoChainedCertificates = AuthenticateResult.fail("Options do not allow chained certificates.");
  export const InvalidClientCertificate = AuthenticateResult.fail("Client certificate failed validation.");

  // Cookies
  export const FailedUnprotectingTicket = AuthenticateResult.fail("Unprotect ticket failed");
  export const MissingSessionId = AuthenticateResult.fail("SessionId missing");
  export const MissingIdentityInSession = AuthenticateResult.fail("Identity missing in session store");
  export const ExpiredTicket = AuthenticateResult.fail("Ticket expired");
  export const NoPrincipal = AuthenticateResult.fail("No principal.");

  // JwtBearer
  export const ValidatorNotFound = AuthenticateResult.fail("No SecurityTokenValidator available for token.");
  export const TokenHandlerUnableToValidate = AuthenticateResult.fail("No TokenHandler was able to validate the token.");
}
