

import { ArgumentNullThrowHelper } from "../types/exception.js";
import { AuthorizationPolicy } from "./authorization.policy.js";

/**
 * Provides programmatic configuration used by IAuthorizationService and IAuthorizationPolicyProvider.
 */
export class AuthorizationOptions {
  private static readonly nullPolicyPromise: Promise<AuthorizationPolicy | null> = Promise.resolve(null);

  private policyMap: Map<string, Promise<AuthorizationPolicy | null>> = new Map();

  /**
   * Determines whether authorization handlers should be invoked after AuthorizationHandlerContext.HasFailed.
   * Defaults to true.
   */
  public invokeHandlersAfterFailure: boolean = true;

  /**
   * Gets or sets the fallback authorization policy used by AuthorizationPolicy.CombineAsync
   * when no authorization metadata (e.g., `[Authorize]` attribute, `RequireAuthorization()`) is explicitly provided for a resource.
   *
   * Remarks:
   * - The `fallbackPolicy` only applies when there are no authorization attributes or explicit policies set.
   * - If a resource has an `[Authorize]` attribute (even without a policy name), the `defaultPolicy` is used instead of the `fallbackPolicy`.
   * - This means `fallbackPolicy` is mainly relevant for middleware-based authorization flows where no per-endpoint authorization is specified.
   * - By default, `fallbackPolicy` is `null`, meaning it has no effect unless explicitly set.
   */
  public fallbackPolicy: AuthorizationPolicy | null = null;

  /**
   * Gets the default authorization policy. Defaults to requiring authenticated users.
   *
   * Remarks:
   * - The `defaultPolicy` applies whenever authorization is required, but no specific policy is set.
   * - If an `[Authorize]` attribute is present without a policy name, the `defaultPolicy` is used instead of the `fallbackPolicy`.
   * - This behavior ensures that endpoints explicitly requesting authorization (via `[Authorize]` or `RequireAuthorization()`) default to a secure policy.
   * - When non-default behavior is needed, developers should define named policies.
   */
  public getDefaultPolicy<PolicyBuilder extends { requireAuthenticatedUser(): PolicyBuilder; build(): AuthorizationPolicy }>(
    builderCtor: new () => PolicyBuilder
  ): AuthorizationPolicy {
    const builder = new builderCtor();
    return builder.requireAuthenticatedUser().build();
  }

  /**
   * Add a policy that is built from a delegate with the provided name.
   * @param name The name of the policy.
   * @param configurePolicy The delegate that will be used to build the policy.
   */
  public addPolicy<PolicyBuilder extends { build(): AuthorizationPolicy }>(
    name: string,
    configurePolicy: (builder: PolicyBuilder) => void,
    builderCtor: new () => PolicyBuilder
  ): void {
    ArgumentNullThrowHelper.throwIfNullOrEmpty(name);
    ArgumentNullThrowHelper.throwIfNull(configurePolicy);

    const policyBuilder = new builderCtor();
    configurePolicy(policyBuilder);
    this.policyMap.set(name, Promise.resolve(policyBuilder.build()));
  }

  /**
   * Returns the policy for the specified name, or null if a policy with the name does not exist.
   * @param name The name of the policy to return.
   * @returns The policy for the specified name, or null if a policy with the name does not exist.
   */
  public async getPolicy(name: string): Promise<AuthorizationPolicy | null> {
    ArgumentNullThrowHelper.throwIfNullOrEmpty(name);

    const value = this.policyMap.get(name);
    return value ? await value : null;
  }

  /**
   * Internal method to return the policy task for the specified name.
   * @param name The name of the policy.
   * @returns A Promise resolving to the policy, or null if not found.
   */
  getPolicyTask(name: string): Promise<AuthorizationPolicy | null> {
    ArgumentNullThrowHelper.throwIfNull(name);
  
    const value = this.policyMap.get(name);
    return value ?? AuthorizationOptions.nullPolicyPromise;
  }
}
