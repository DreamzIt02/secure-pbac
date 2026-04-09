import { IAuthorizationRequirement, IAuthorizeData } from "./types/index.js";
import { AuthorizationPolicy } from "./authorization.policy.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { ClaimsAuthorizationRequirement } from "./claims.authorization.requirement.js";
import { RolesAuthorizationRequirement } from "./roles.authorization.requirement.js";
import { DefaultAuthorizationPolicyProvider } from "./authorization.policy.provider.js";
import { AssertionRequirement } from "./assertion.requirement.js";
import { NameAuthorizationRequirement } from "./name.authorization.requirement.js";

/**
 * Used for building policies.
 */
export class AuthorizationPolicyBuilder {
  private static readonly DenyAnonymousAuthorizationRequirement = {
    toString: () => "DenyAnonymousAuthorizationRequirement: Requires authenticated user",
  } as IAuthorizationRequirement;

  public requirements: IAuthorizationRequirement[] = [];
  public authenticationSchemes: string[] = [];

  constructor(...authenticationSchemes: string[]) {
    if (authenticationSchemes && authenticationSchemes.length > 0) {
      this.addAuthenticationSchemes(...authenticationSchemes);
    }
  }

  public static fromPolicy(policy: AuthorizationPolicy): AuthorizationPolicyBuilder {
    const builder = new AuthorizationPolicyBuilder();
    builder.combine(policy);
    return builder;
  }

  public addAuthenticationSchemes(...schemes: string[]): AuthorizationPolicyBuilder {
    for (const scheme of schemes) {
      this.authenticationSchemes.push(scheme);
    }
    return this;
  }

  public addRequirements(...requirements: IAuthorizationRequirement[]): AuthorizationPolicyBuilder {
    for (const req of requirements) {
      this.requirements.push(req);
    }
    return this;
  }

  public combine(policy: AuthorizationPolicy): AuthorizationPolicyBuilder {
    this.addAuthenticationSchemes(...policy.authenticationSchemes);
    this.addRequirements(...policy.requirements);
    return this;
  }

  public requireClaim(claimType: string, allowedValues?: Iterable<string>): AuthorizationPolicyBuilder {
    this.requirements.push(new ClaimsAuthorizationRequirement(claimType, allowedValues));
    return this;
  }

  public requireRole(...roles: string[]): AuthorizationPolicyBuilder {
    this.requirements.push(new RolesAuthorizationRequirement(roles));
    return this;
  }

  public requireUserName(userName: string): AuthorizationPolicyBuilder {
    this.requirements.push(new NameAuthorizationRequirement(userName));
    return this;
  }

  public requireAuthenticatedUser(): AuthorizationPolicyBuilder {
    this.requirements.push(AuthorizationPolicyBuilder.DenyAnonymousAuthorizationRequirement);
    return this;
  }

  public requireAssertion(handler: (context: AuthorizationHandlerContext) => boolean | Promise<boolean>): AuthorizationPolicyBuilder {
    this.requirements.push(new AssertionRequirement(handler));
    return this;
  }

  public build(): AuthorizationPolicy {
    const distinctSchemes = Array.from(new Set(this.authenticationSchemes));
    return new AuthorizationPolicy(this.requirements, distinctSchemes);
  }
  
  // -----------------------------
  // Static Combine Methods
  // -----------------------------

  /**
   * Combines the specified AuthorizationPolicy into a single policy.
   * @param policies The authorization policies to combine.
   * @returns A new AuthorizationPolicy which represents the combination of the specified policies.
   */
  public static combine(...policies: AuthorizationPolicy[]): AuthorizationPolicy {
    return AuthorizationPolicyBuilder.combineEnumerable(policies);
  }

  /**
   * Combines the specified AuthorizationPolicy into a single policy.
   * @param policies The authorization policies to combine.
   * @returns A new AuthorizationPolicy which represents the combination of the specified policies.
   */
  public static combineEnumerable(policies: AuthorizationPolicy[]): AuthorizationPolicy {
    const builder = new AuthorizationPolicyBuilder();
    for (const policy of policies) {
      builder.combine(policy);
    }
    return builder.build();
  }


  /**
   * Combines the AuthorizationPolicy provided by the specified policyProvider.
   * @param policyProvider A provider which supplies the policies to combine.
   * @param authorizeData A collection of authorization data used to apply authorization to a resource.
   * @returns A new AuthorizationPolicy which represents the combination of the authorization policies provided.
   */
  public static async combineAsync(
    policyProvider: DefaultAuthorizationPolicyProvider,
    authorizeData: IAuthorizeData[],
    policies: AuthorizationPolicy[] = []
  ): Promise<AuthorizationPolicy | null> {
    const anyPolicies = policies.length > 0;
    let policyBuilder: AuthorizationPolicyBuilder | null = null;

    if (authorizeData && authorizeData.length > 0) {
      for (const authorizeDatum of authorizeData) {
        if (!policyBuilder) {
          policyBuilder = new AuthorizationPolicyBuilder();
        }

        let useDefaultPolicy = !anyPolicies;

        if (authorizeDatum.policy) {
          const policy = await policyProvider.getPolicyAsync(authorizeDatum.policy);
          if (!policy) {
            throw new Error(`AuthorizationPolicy not found: ${authorizeDatum.policy}`);
          }
          policyBuilder.combine(policy);
          useDefaultPolicy = false;
        }

        if (authorizeDatum.roles) {
          const rolesSplit = authorizeDatum.roles.split(",").map(r => r.trim()).filter(r => r.length > 0);
          if (rolesSplit.length > 0) {
            policyBuilder.requireRole(...rolesSplit);
            useDefaultPolicy = false;
          }
        }

        if (authorizeDatum.authenticationSchemes) {
          const authTypesSplit = authorizeDatum.authenticationSchemes.split(",").map(a => a.trim()).filter(a => a.length > 0);
          for (const authType of authTypesSplit) {
            policyBuilder.authenticationSchemes.push(authType);
          }
        }

        if (useDefaultPolicy) {
          const defaultPolicy = await policyProvider.getDefaultPolicyAsync();
          policyBuilder.combine(defaultPolicy);
        }
      }
    }

    if (anyPolicies) {
      policyBuilder ??= new AuthorizationPolicyBuilder();
      for (const policy of policies) {
        policyBuilder.combine(policy);
      }
    }

    if (!policyBuilder) {
      const fallbackPolicy = await policyProvider.getFallbackPolicyAsync();
      if (fallbackPolicy) {
        return fallbackPolicy;
      }
    }

    return policyBuilder?.build() ?? null;
  }

}
