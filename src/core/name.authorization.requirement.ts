import { AuthorizationHandler } from "./authorization.handler.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationRequirement } from "./types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's NameAuthorizationRequirement.
 */
export class NameAuthorizationRequirement
  extends AuthorizationHandler<NameAuthorizationRequirement>
  implements IAuthorizationRequirement
{

  /**
   * Creates a new instance of NameAuthorizationRequirement.
   * @param claimType The claim type that must be present.
   * @param allowedValues Optional list of claim values. If specified, the claim must match one or more of these values.
   */
  constructor(
    public requiredName: string,
  ) {
    super();
    ArgumentNullThrowHelper.throwIfNull(requiredName);
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: NameAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: NameAuthorizationRequirement,
    resource: object
  ): Promise<void>;

  // Implementation
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: NameAuthorizationRequirement,
    resource?: object
  ): Promise<void> {
    if (context.user) {
      let succeed = false;

      for (let identity of context.user.identities)
      {
          if (identity.name?.toLowerCase() === requirement.requiredName.toLowerCase())
          {
              succeed = true;
              break;
          }
      }

      if (succeed)
      {
          context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }

  /**
   * Returns a string representation of the requirement.
   */
  public toString(): string {
    return `${this.constructor.name}:Requires a user identity with Name equal to ${this.requiredName}`;
  }
  /**
   * Type guard to check if the requirement is of type NameAuthorizationRequirement.
   */
  protected isRequirementType(requirement: IAuthorizationRequirement): requirement is NameAuthorizationRequirement {
    return requirement instanceof NameAuthorizationRequirement;
  }
}
