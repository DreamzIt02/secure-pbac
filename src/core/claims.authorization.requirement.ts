import { AuthorizationHandler } from "./authorization.handler.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationRequirement } from "./types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { isEmpty } from "../utils.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's ClaimsAuthorizationRequirement.
 */
export class ClaimsAuthorizationRequirement
  extends AuthorizationHandler<ClaimsAuthorizationRequirement>
  implements IAuthorizationRequirement
{
  private readonly emptyAllowedValues: boolean;

  /**
   * Creates a new instance of ClaimsAuthorizationRequirement.
   * @param claimType The claim type that must be present.
   * @param allowedValues Optional list of claim values. If specified, the claim must match one or more of these values.
   */
  constructor(
    public claimType: string,
    public allowedValues?: Iterable<string>
  ) {
    super();
    ArgumentNullThrowHelper.throwIfNull(claimType);
    
    this.emptyAllowedValues = !allowedValues || isEmpty(allowedValues);
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: ClaimsAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: ClaimsAuthorizationRequirement,
    resource: object
  ): Promise<void>;

  // Implementation
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: ClaimsAuthorizationRequirement,
    resource?: object
  ): Promise<void> {
    if (context.user) {
      let found = false;

      for (const claim of context.user.claims ?? []) 
      {
        if (claim.includes(requirement.claimType, requirement.emptyAllowedValues ? undefined : requirement.allowedValues)) 
        {
          found = true;
          break;
        }
      }

      if (found) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }

  /**
   * Returns a string representation of the requirement.
   */
  public toString(): string {
    const value = this.emptyAllowedValues
      ? ""
      : ` and Claim.Value is one of the following values: (${[...this.allowedValues!].join("|")})`;

    return `${this.constructor.name}:Claim.Type=${this.claimType}${value}`;
  }

  /**
   * Type guard to check if the requirement is of type ClaimsAuthorizationRequirement.
   */
  protected isRequirementType(requirement: IAuthorizationRequirement): requirement is ClaimsAuthorizationRequirement {
    return requirement instanceof ClaimsAuthorizationRequirement;
  }
}
