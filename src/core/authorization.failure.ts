// -----------------------------
// Core Interfaces
// -----------------------------
import { IAuthorizationHandler, IAuthorizationRequirement } from "./types.js";

/**
 * Encapsulates a reason why authorization failed.
 */
export class AuthorizationFailureReason {
  /**
   * Creates a new failure reason.
   * @param handler The handler responsible for this failure reason.
   * @param message The message describing the failure.
   */
  constructor(
    public handler: IAuthorizationHandler,
    public message: string
  ) {}
}

/**
 * Encapsulates a failure result of IAuthorizationService.AuthorizeAsync.
 */
export class AuthorizationFailure {
  private static readonly explicitFailure: AuthorizationFailure = new AuthorizationFailure(true);

  private constructor(
    /**
     * Failure was due to AuthorizationHandlerContext.fail() being called.
     */
    public failCalled: boolean = false,

    /**
     * Failure was due to these requirements not being met via AuthorizationHandlerContext.succeed(requirement).
     */
    public failedRequirements: IAuthorizationRequirement[] = [],

    /**
     * Allows IAuthorizationHandler to flow more detailed reasons for why authorization failed.
     */
    public failureReasons: AuthorizationFailureReason[] = []
  ) {}

  /**
   * Return a failure due to AuthorizationHandlerContext.fail() being called.
   * @returns The failure.
   */
  public static explicitFail(): AuthorizationFailure {
    return AuthorizationFailure.explicitFailure;
  }

  /**
   * Return a failure due to AuthorizationHandlerContext.fail(reason) being called.
   * @param reasons The detailed reasons for failure.
   * @returns The failure.
   */
  public static failedWithReasons(reasons: AuthorizationFailureReason[]): AuthorizationFailure {
    return new AuthorizationFailure(true, [], reasons);
  }

  /**
   * Return a failure due to some requirements not being met via AuthorizationHandlerContext.succeed(requirement).
   * @param failed The requirements that were not met.
   * @returns The failure.
   */
  public static failedRequirements(failed: IAuthorizationRequirement[]): AuthorizationFailure {
    return new AuthorizationFailure(false, failed, []);
  }
}
