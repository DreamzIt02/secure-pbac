import { IAuthorizationRequirement } from "./types.js";
import { AuthorizationHandler } from "./authorization.handler.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 */
export class ClaimsAuthorizationRequirement
  extends AuthorizationHandler<ClaimsAuthorizationRequirement>
  implements IAuthorizationRequirement {
  private readonly emptyAllowedValues: boolean;

  /**
   * Creates a new instance of ClaimsAuthorizationRequirement.
   * @param claimType The claim type that must be present.
   * @param allowedValues Optional list of claim values. If specified, the claim must match one or more of these values.
   */
  constructor(
    public claimType: string,
    public allowedValues?: string[]
  ) {
    super();
    if (!claimType) {
      throw new Error("claimType cannot be null or empty");
    }
    this.emptyAllowedValues = !allowedValues || allowedValues.length === 0;
  }

  /**
   * Makes a decision if authorization is allowed based on the claims requirements specified.
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   */
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: ClaimsAuthorizationRequirement
  ): Promise<void> {
    if (context.user) {
      let found = false;

      if (requirement.emptyAllowedValues) {
        for (const claim of context.user.claims ?? []) {
          if (claim.type.toLowerCase() === requirement.claimType.toLowerCase()) {
            found = true;
            break;
          }
        }
      } else {
        for (const claim of context.user.claims ?? []) {
          if (
            claim.type.toLowerCase() === requirement.claimType.toLowerCase() &&
            requirement.allowedValues!.includes(claim.value)
          ) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        context.succeed(requirement);
      }
    }
  }

  /**
   * Returns a string representation of the requirement.
   */
  public toString(): string {
    const value = this.emptyAllowedValues
      ? ""
      : ` and Claim.Value is one of the following values: (${this.allowedValues!.join("|")})`;

    return `${this.constructor.name}:Claim.Type=${this.claimType}${value}`;
  }

  /**
   * Type guard to check if the requirement is of type ClaimsAuthorizationRequirement.
   */
  protected isRequirementType(requirement: IAuthorizationRequirement): boolean {
    return requirement instanceof ClaimsAuthorizationRequirement;
  }
}
