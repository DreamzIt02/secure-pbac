// authorization.failure.ts

import { AuthorizationFailureReason } from "./authorization.failure.reason.js";
import { IAuthorizationRequirement } from "./types/index.js";

/**
 * Encapsulates a failure result of an authorization attempt.
 *
 * Mirrors ASP.NET Core's AuthorizationFailure.
 */
export class AuthorizationFailure {
  private static readonly _explicitFailure: AuthorizationFailure = new AuthorizationFailure(true);

  /**
   * Failure was due to `AuthorizationHandlerContext.fail()` being called.
   */
  public readonly failCalled: boolean;

  /**
   * Failure was due to these requirements not being met via `AuthorizationHandlerContext.succeed(requirement)`.
   */
  public readonly failedRequirements: IAuthorizationRequirement[];

  /**
   * Allows `IAuthorizationHandler` to flow more detailed reasons for why authorization failed.
   */
  public readonly failureReasons: AuthorizationFailureReason[];

  private constructor(
    failCalled: boolean = false,
    failedRequirements: IAuthorizationRequirement[] = [],
    failureReasons: AuthorizationFailureReason[] = []
  ) {
    this.failCalled = failCalled;
    this.failedRequirements = failedRequirements;
    this.failureReasons = failureReasons;
  }

  /**
   * Return a failure due to `AuthorizationHandlerContext.fail()` being called.
   * @returns The failure.
   */
  public static explicitFail(): AuthorizationFailure {
    return AuthorizationFailure._explicitFailure;
  }

  /**
   * Return a failure due to `AuthorizationHandlerContext.fail(reason)` being called.
   * @param reasons The detailed failure reasons.
   * @returns The failure.
   */
  public static failed(reasons: AuthorizationFailureReason[]): AuthorizationFailure;
  /**
   * Return a failure due to some requirements not being met via `AuthorizationHandlerContext.succeed(requirement)`.
   * @param failed The requirements that were not met.
   * @returns The failure.
   */
  public static failed(failed: IAuthorizationRequirement[]): AuthorizationFailure;

  // Implementation of overloads
  public static failed(
    arg: AuthorizationFailureReason[] | IAuthorizationRequirement[]
  ): AuthorizationFailure {
    if (arg.length > 0 && "message" in arg[0]) {
      // Treat as AuthorizationFailureReason[]
      return new AuthorizationFailure(true, [], arg as AuthorizationFailureReason[]);
    } else {
      // Treat as IAuthorizationRequirement[]
      return new AuthorizationFailure(false, arg as IAuthorizationRequirement[], []);
    }
  }
}
