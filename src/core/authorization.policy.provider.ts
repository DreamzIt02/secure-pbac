

import { AuthorizationPolicy } from "./authorization.policy.js";
import { AuthorizationOptions } from "./authorization.options.js";
import { IOptions } from "../types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import type { IAuthorizationPolicyBuilderConstructor } from "./types/index.js";

/**
 * A type which can provide an AuthorizationPolicy for a particular name.
 */
export interface IAuthorizationPolicyProvider {
  /**
   * Gets an AuthorizationPolicy from the given policyName.
   * @param policyName The policy name to retrieve.
   * @returns The named AuthorizationPolicy, or null if not found.
   */
  getPolicyAsync(policyName: string): Promise<AuthorizationPolicy | null>;

  /**
   * Gets the default authorization policy.
   * @returns The default AuthorizationPolicy.
   */
  getDefaultPolicyAsync(): Promise<AuthorizationPolicy>;

  /**
   * Gets the fallback authorization policy.
   * @returns The fallback AuthorizationPolicy, or null if not set.
   */
  getFallbackPolicyAsync(): Promise<AuthorizationPolicy | null>;

  /**
   * Determines if policies from this provider can be cached.
   * Defaults to false unless overridden.
   */
  allowsCachingPolicies?: boolean;
}

/**
 * The default implementation of a policy provider,
 * which provides an AuthorizationPolicy for a particular name.
 */
export class DefaultAuthorizationPolicyProvider implements IAuthorizationPolicyProvider {
  private readonly options: AuthorizationOptions;
  private cachedDefaultPolicy?: Promise<AuthorizationPolicy>;
  private cachedFallbackPolicy?: Promise<AuthorizationPolicy | null>;

  /**
   * Creates a new instance of DefaultAuthorizationPolicyProvider.
   * @param options The options used to configure this instance.
   */
  constructor(options: IOptions<AuthorizationOptions>) {
    ArgumentNullThrowHelper.throwIfNull(options);
    
    this.options = options.value;
  }

  /**
   * Gets the default authorization policy.
   */
  public async getDefaultPolicyAsync(): Promise<AuthorizationPolicy> {
    if (
      !this.cachedDefaultPolicy ||
      (await this.cachedDefaultPolicy) !== this.options.getDefaultPolicy({} as IAuthorizationPolicyBuilderConstructor)
    ) {
      this.cachedDefaultPolicy = Promise.resolve(this.options.getDefaultPolicy({} as IAuthorizationPolicyBuilderConstructor));
    }
    return this.cachedDefaultPolicy;
  }


  /**
   * Gets the fallback authorization policy.
   */
  public async getFallbackPolicyAsync(): Promise<AuthorizationPolicy | null> {
    if (!this.cachedFallbackPolicy || (await this.cachedFallbackPolicy) !== this.options.fallbackPolicy) {
      this.cachedFallbackPolicy = Promise.resolve(this.options.fallbackPolicy);
    }
    return this.cachedFallbackPolicy;
  }

  /**
   * Gets an AuthorizationPolicy from the given policyName.
   * Must return the same policy per policyName for every request.
   */
  public async getPolicyAsync(policyName: string): Promise<AuthorizationPolicy | null> {
    return this.options.getPolicyTask(policyName);
  }

  /**
   * Determines if policies from this provider can be cached.
   * True only for this type.
   */
  public allowsCachingPolicies: boolean = true;
}
