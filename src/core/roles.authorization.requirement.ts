import { AuthorizationHandler } from "./authorization.handler.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationRequirement } from "./types/index.js";
import { ArgumentNullThrowHelper, InvalidOperationException } from "../types/exception.js";
import { isEmpty } from "../utils.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires the user to be in at least one of the specified roles.
 *
 * Mirrors ASP.NET Core's RolesAuthorizationRequirement.
 */
export class RolesAuthorizationRequirement
  extends AuthorizationHandler<RolesAuthorizationRequirement>
  implements IAuthorizationRequirement
{
  private readonly _allowedRoles: Iterable<string>;

  /**
   * Creates a new instance of RolesAuthorizationRequirement.
   * @param roles The list of roles the user must belong to.
   */
  constructor(allowedRoles: Iterable<string>) {
    super();
    ArgumentNullThrowHelper.throwIfNull(allowedRoles);

    if (isEmpty(allowedRoles)) {
      throw new InvalidOperationException("Roles cannot be null or empty");
    }
    this._allowedRoles = allowedRoles;
  }

  /**
   * Gets the list of roles the user must belong to.
   */
  public get allowedRoles(): Iterable<string> {
    return this._allowedRoles;
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: RolesAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: RolesAuthorizationRequirement,
    resource: object
  ): Promise<void>;

  // Implementation
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: RolesAuthorizationRequirement,
    resource?: object | null
  ): Promise<void> {

    if (context.user) {
      let found = false;

      for (let role of requirement.allowedRoles)
      {
          if (context.user.isInRole(role))
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
    return `${this.constructor.name}: Requires user in one of the roles (${[...this.allowedRoles].join("|")})`;
  }

  /**
   * Type guard to check if the requirement is of type RolesAuthorizationRequirement.
   */
  protected isRequirementType(
    requirement: IAuthorizationRequirement
  ): requirement is RolesAuthorizationRequirement {
    return requirement instanceof RolesAuthorizationRequirement;
  }
}
