import { PolicyAuthorizationResult } from "./policy.authorization.result.js";
import { AuthorizationPolicy } from "../core/index.js";
import { IAuthorizationService } from "../core/index.js";
import { HttpContext } from "../http/index.js";
import { AuthenticateResult, AuthenticationTicket } from "../http/authentication/index.js";
import { ClaimsIdentity, ClaimsPrincipal, SecurityHelper } from "../claims/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";

/**
 * Base interface for authorization handlers that need to be called for a specific requirement type.
 *
 * Defines the contract for evaluating policies:
 * - Performing authentication for the schemes defined in the policy.
 * - Attempting authorization using the provided `IAuthorizationService`.
 */
export interface IPolicyEvaluator {
  /**
   * Does authentication for `AuthorizationPolicy.authenticationSchemes` and sets the resulting
   * `ClaimsPrincipal` to `HttpContext.user`. If no schemes are set, this is a no-op.
   *
   * @param policy The `AuthorizationPolicy`.
   * @param context The `HttpContext`.
   * @returns An `AuthenticateResult.success()` unless all schemes specified by
   *          `AuthorizationPolicy.authenticationSchemes` fail to authenticate.
   */
  authenticateAsync(policy: AuthorizationPolicy, context: HttpContext): Promise<AuthenticateResult>;

  /**
   * Attempts authorization for a policy using `IAuthorizationService`.
   *
   * @param policy The `AuthorizationPolicy`.
   * @param authenticationResult The result of a call to `authenticateAsync`.
   * @param context The `HttpContext`.
   * @param resource An optional resource the policy should be checked with.
   * @returns Returns `PolicyAuthorizationResult.success()` if authorization succeeds.
   *          Otherwise returns `PolicyAuthorizationResult.forbid(failure)` if `AuthenticateResult.succeeded`,
   *          otherwise returns `PolicyAuthorizationResult.challenge()`.
   */
  authorizeAsync(
    policy: AuthorizationPolicy,
    authenticationResult: AuthenticateResult,
    context: HttpContext,
    resource?: unknown
  ): Promise<PolicyAuthorizationResult>;
}

/**
 * Default implementation for `IPolicyEvaluator`.
 *
 * This class performs authentication and authorization based on the provided policy and context.
 */
export class PolicyEvaluator implements IPolicyEvaluator {
  private readonly authorization: IAuthorizationService;

  /**
   * Constructor.
   *
   * @param authorization The authorization service.
   */
  constructor(authorization: IAuthorizationService) {
    this.authorization = authorization;
  }

  /**
   * Does authentication for `AuthorizationPolicy.authenticationSchemes` and sets the resulting
   * `ClaimsPrincipal` to `HttpContext.user`. If no schemes are set, this is a no-op.
   *
   * @param policy The `AuthorizationPolicy`.
   * @param context The `HttpContext`.
   * @returns An `AuthenticateResult.success()` unless all schemes specified by
   *          `AuthorizationPolicy.authenticationSchemes` failed to authenticate.
   */
  async authenticateAsync(policy: AuthorizationPolicy, context: HttpContext): Promise<AuthenticateResult> {
    if (policy.authenticationSchemes && policy.authenticationSchemes.length > 0) {
      let newPrincipal: ClaimsPrincipal | null = null;
      let minExpiresUtc: Date | null = null;

      for (const scheme of policy.authenticationSchemes) {
        const result = await context.authenticateAsync(scheme);
        if (result && result.succeeded) {
          newPrincipal = SecurityHelper.mergeUserPrincipal(newPrincipal, result.principal!);

          const expires = result.properties?.expiresUtc ?? null;
          if (!minExpiresUtc || (expires && expires < minExpiresUtc)) {
            minExpiresUtc = expires;
          }
        }
      }

      if (newPrincipal) {
        context.user = newPrincipal;
        const ticket = new AuthenticationTicket(newPrincipal, null, policy.authenticationSchemes.join(";"));
        ticket.properties.expiresUtc = minExpiresUtc ?? null;
        return AuthenticateResult.success(ticket);
      } else {
        context.user = new ClaimsPrincipal([new ClaimsIdentity()]);
        return AuthenticateResult.noResult();
      }
    }

    // No modifications made to the HttpContext so let's use the existing result if it exists
    return context.authenticateResultFeature?.authenticateResult ?? this.defaultAuthenticateResult(context);
  }

  private defaultAuthenticateResult(context: HttpContext): AuthenticateResult {
    return (context.user?.identity?.isAuthenticated ?? false)
      ? AuthenticateResult.success(new AuthenticationTicket(context.user!, null, "context.User"))
      : AuthenticateResult.noResult();
  }

  /**
   * Attempts authorization for a policy using `IAuthorizationService`.
   *
   * @param policy The `AuthorizationPolicy`.
   * @param authenticationResult The result of a call to `authenticateAsync`.
   * @param context The `HttpContext`.
   * @param resource An optional resource the policy should be checked with.
   * @returns Returns `PolicyAuthorizationResult.success()` if authorization succeeds.
   *          Otherwise returns `PolicyAuthorizationResult.forbid(failure)` if `AuthenticateResult.succeeded`,
   *          otherwise returns `PolicyAuthorizationResult.challenge()`.
   */
  async authorizeAsync(
    policy: AuthorizationPolicy,
    authenticationResult: AuthenticateResult,
    context: HttpContext,
    resource?: object | null
  ): Promise<PolicyAuthorizationResult> {
    ArgumentNullThrowHelper.throwIfNull(policy);

    const result = await this.authorization.authorizeAsync(context.user, resource ?? null, policy.requirements);
    if (result.succeeded) {
      return PolicyAuthorizationResult.success();
    }

    // If authentication was successful, return forbidden, otherwise challenge
    return authenticationResult.succeeded
      ? PolicyAuthorizationResult.forbid(result.failure ?? null)
      : PolicyAuthorizationResult.challenge();
  }
}
