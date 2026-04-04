import { IAuthorizationHandler, IAuthorizationRequirement, } from "./types.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";

/**
 * Base class for authorization handlers that need to be called for a specific requirement type.
 * @typeparam TRequirement The type of the requirement to handle.
 */
export abstract class AuthorizationHandler<TRequirement extends IAuthorizationRequirement>
  implements IAuthorizationHandler
{
  /**
   * Makes a decision if authorization is allowed.
   * @param context The authorization context.
   */
  async handleAsync(
    context: AuthorizationHandlerContext
  ): Promise<void> {
    for (const req of context.requirements) {
      if (this.isRequirementType(req)) {
        await this.handleRequirementAsync(context, req as TRequirement);
      }
    }
  }

  /**
   * Type guard to check if the requirement is of type TRequirement.
   */
  protected abstract isRequirementType(
    requirement: IAuthorizationRequirement
  ): boolean;

  /**
   * Makes a decision if authorization is allowed based on a specific requirement.
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   */
  protected abstract handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: TRequirement
  ): Promise<void>;
}

/**
 * Base class for authorization handlers that need to be called for specific requirement and resource types.
 * @typeparam TRequirement The type of the requirement to evaluate.
 * @typeparam TResource The type of the resource to evaluate.
 */
export abstract class AuthorizationHandlerWithResource<
  TRequirement extends IAuthorizationRequirement,
  TResource
> implements IAuthorizationHandler {
  /**
   * Makes a decision if authorization is allowed.
   * @param context The authorization context.
   */
  async handleAsync(context: AuthorizationHandlerContext): Promise<void> {
    const resource = context.resource;
    if (this.isResourceType(resource)) {
      for (const req of context.requirements) {
        if (this.isRequirementType(req)) {
          await this.handleRequirementAsync(context, req as TRequirement, resource as TResource);
        }
      }
    }
  }

  /**
   * Type guard to check if the requirement is of type TRequirement.
   */
  protected abstract isRequirementType(requirement: IAuthorizationRequirement): boolean;

  /**
   * Type guard to check if the resource is of type TResource.
   */
  protected abstract isResourceType(resource: any): resource is TResource;

  /**
   * Makes a decision if authorization is allowed based on a specific requirement and resource.
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   * @param resource The resource to evaluate.
   */
  protected abstract handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: TRequirement,
    resource: TResource
  ): Promise<void>;
}
