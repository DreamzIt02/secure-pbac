import { AuthorizationFailure } from "./authorization.failure.js";

/**
 * Encapsulates the result of IAuthorizationService.AuthorizeAsync.
 */
export class AuthorizationResult {
  private static readonly succeededResult: AuthorizationResult = new AuthorizationResult(true);
  private static readonly failedResult: AuthorizationResult = new AuthorizationResult(false, AuthorizationFailure.explicitFail());

  /**
   * True if authorization was successful.
   */
  public succeeded: boolean;

  /**
   * Contains information about why authorization failed.
   */
  public failure?: AuthorizationFailure;

  private constructor(succeeded: boolean = false, failure?: AuthorizationFailure) {
    this.succeeded = succeeded;
    this.failure = failure;
  }

  /**
   * Returns a successful result.
   * @returns A successful result.
   */
  public static success(): AuthorizationResult {
    return AuthorizationResult.succeededResult;
  }

  /**
   * Creates a failed authorization result.
   * @param failure Contains information about why authorization failed.
   * @returns The AuthorizationResult.
   */
  public static failed(failure: AuthorizationFailure): AuthorizationResult {
    return new AuthorizationResult(false, failure);
  }

  /**
   * Creates a failed authorization result.
   * @returns The AuthorizationResult.
   */
  public static failedDefault(): AuthorizationResult {
    return AuthorizationResult.failedResult;
  }
}
