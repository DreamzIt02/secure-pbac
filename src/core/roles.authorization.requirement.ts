import { IAuthorizationRequirement } from "./types.js";
import { AuthorizationHandler } from "./authorization.handler.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires the user to be in at least one of the specified roles.
 */
export class RolesAuthorizationRequirement
  extends AuthorizationHandler<RolesAuthorizationRequirement>
  implements IAuthorizationRequirement {
  private readonly allowedRoles: string[];

  /**
   * Creates a new instance of RolesAuthorizationRequirement.
   * @param roles The list of roles the user must belong to.
   */
  constructor(roles: string[]) {
    super();
    if (!roles || roles.length === 0) {
      throw new Error("roles cannot be null or empty");
    }
    this.allowedRoles = roles;
  }

  /**
   * Gets the list of roles the user must belong to.
   */
  public get AllowedRoles(): string[] {
    return this.allowedRoles;
  }

  /**
   * Makes a decision if authorization is allowed based on the roles requirements specified.
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   */
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: RolesAuthorizationRequirement
  ): Promise<void> {
    if (context.user) {
      const userRoles: string[] = context.user.roles ?? [];
      const found = userRoles.some(userRole =>
        requirement.AllowedRoles.some(
          requiredRole => requiredRole.toLowerCase() === userRole.toLowerCase()
        )
      );

      if (found) {
        context.succeed(requirement);
      }
    }
  }

  /**
   * Returns a string representation of the requirement.
   */
  public toString(): string {
    return `${this.constructor.name}: Requires user in one of the roles (${this.allowedRoles.join("|")})`;
  }

  /**
   * Type guard to check if the requirement is of type RolesAuthorizationRequirement.
   */
  protected isRequirementType(requirement: IAuthorizationRequirement): boolean {
    return requirement instanceof RolesAuthorizationRequirement;
  }
}
