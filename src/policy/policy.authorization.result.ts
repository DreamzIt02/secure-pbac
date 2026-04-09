import { AuthorizationFailure } from "../core/index.js";

/**
 * The result of a policy authorization evaluation.
 *
 * This class represents whether authorization succeeded, was forbidden, or required a challenge.
 * It encapsulates flags for each outcome and optionally includes an `AuthorizationFailure`
 * object describing why authorization failed.
 *
 * Example usage:
 * ```ts
 * const challenge = PolicyAuthorizationResult.challenge();
 * console.log(challenge.challenged); // true
 *
 * const forbid = PolicyAuthorizationResult.forbid(new AuthorizationFailure("Missing role"));
 * console.log(forbid.forbidden); // true
 * console.log(forbid.authorizationFailure?.reason); // "Missing role"
 *
 * const success = PolicyAuthorizationResult.success();
 * console.log(success.succeeded); // true
 * ```
 */
export class PolicyAuthorizationResult {
  private static readonly _challengedResult = new PolicyAuthorizationResult({ challenged: true });
  private static readonly _forbiddenResult = new PolicyAuthorizationResult({ forbidden: true });
  private static readonly _succeededResult = new PolicyAuthorizationResult({ succeeded: true });

  /**
   * If true, means the callee should challenge and try again.
   */
  public challenged: boolean;

  /**
   * Authorization was forbidden.
   */
  public forbidden: boolean;

  /**
   * Authorization was successful.
   */
  public succeeded: boolean;

  /**
   * Contains information about why authorization failed.
   */
  public authorizationFailure?: AuthorizationFailure;

  private constructor(init?: {
    challenged?: boolean;
    forbidden?: boolean;
    succeeded?: boolean;
    authorizationFailure?: AuthorizationFailure;
  }) {
    this.challenged = init?.challenged ?? false;
    this.forbidden = init?.forbidden ?? false;
    this.succeeded = init?.succeeded ?? false;
    this.authorizationFailure = init?.authorizationFailure;
  }

  /**
   * Indicates that an unauthenticated user requested access to an endpoint that requires authentication.
   *
   * @returns A `PolicyAuthorizationResult` indicating a challenge.
   */
  static challenge(): PolicyAuthorizationResult {
    return PolicyAuthorizationResult._challengedResult;
  }

  /**
   * Indicates that the access to a resource was forbidden.
   *
   * @returns A `PolicyAuthorizationResult` indicating forbidden access.
   */
  static forbid(): PolicyAuthorizationResult;

  /**
   * Indicates that the access to a resource was forbidden, with a specific failure reason.
   *
   * @param authorizationFailure Specifies the reason the authorization failed.
   * @returns A `PolicyAuthorizationResult` indicating forbidden access.
   */
  static forbid(authorizationFailure: AuthorizationFailure | null): PolicyAuthorizationResult;

  // Implementation of overloads
  static forbid(authorizationFailure?: AuthorizationFailure | null): PolicyAuthorizationResult {
    if (!authorizationFailure) {
      return PolicyAuthorizationResult._forbiddenResult;
    }
    return new PolicyAuthorizationResult({ forbidden: true, authorizationFailure });
  }

  /**
   * Indicates a successful authorization.
   *
   * @returns A `PolicyAuthorizationResult` indicating success.
   */
  static success(): PolicyAuthorizationResult {
    return PolicyAuthorizationResult._succeededResult;
  }
}
