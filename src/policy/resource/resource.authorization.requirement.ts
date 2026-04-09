import { AuthorizationHandler, AuthorizationHandlerContext } from "../../core/index.js";
import { IAuthorizationService } from "../../core/index.js";
import { IAuthorizationRequirement } from "../../core/types/index.js";
import { ICreatorInfo, IManagerInfo } from "../../types/index.js";
import { OperationAuthorizationRequirement } from "./operation.authorization.requirement.js";

/**
 * Authorization handler that checks if the current user is the Manager of the resource.
 *
 * Mirrors ASP.NET Core's ResourceManagerAuthorizationHandler.
 */
export class ResourceManagerAuthorizationHandler<TEntity extends IManagerInfo>
  extends AuthorizationHandler<OperationAuthorizationRequirement, TEntity>
{
  protected isRequirementType(r: IAuthorizationRequirement): r is OperationAuthorizationRequirement {
    return r instanceof OperationAuthorizationRequirement;
  }

  private readonly authorization: IAuthorizationService;

  constructor(authorization: IAuthorizationService) {
    super();
    this.authorization = authorization;
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement,
    resource: TEntity
  ): Promise<void>;

  // Implementation
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement,
    resource?: TEntity
  ): Promise<void> {
    console.log("Manager authorization ++++++++++++++++++++++++++++++++++");

    if (!context.user || !resource) {
      return;
    }

    if (requirement.name !== "ManagerOperation") {
      return;
    }

    const currentUserName = context.user.identities[0]?.name;
    if (resource.manager === currentUserName) {
      context.succeed(requirement);
    }
  }
}

/**
 * Authorization handler that checks if the current user is the Owner (Creator) of the resource.
 *
 * Mirrors ASP.NET Core's ResourceOwnerAuthorizationHandler.
 */
export class ResourceOwnerAuthorizationHandler<TEntity extends ICreatorInfo>
  extends AuthorizationHandler<OperationAuthorizationRequirement, TEntity>
{
  protected isRequirementType(r: IAuthorizationRequirement): r is OperationAuthorizationRequirement {
    return r instanceof OperationAuthorizationRequirement;
  }

  private readonly authorization: IAuthorizationService;

  constructor(authorization: IAuthorizationService) {
    super();
    this.authorization = authorization;
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement,
    resource: TEntity
  ): Promise<void>;

  // Implementation
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: OperationAuthorizationRequirement,
    resource?: TEntity
  ): Promise<void> {
    console.log("Owner authorization +++++++++++++++++++++++++++++++++++");

    if (!context.user || !resource) {
      return;
    }

    const validOps = ["Create", "Read", "Update", "Delete"];
    if (!validOps.includes(requirement.name)) {
      return;
    }

    const currentUserName = context.user.identities[0]?.name;
    const currentUserId   = context.user.identities[0]?.id;

    if (resource.createBy === currentUserName || resource.createBy === currentUserId) {
      context.succeed(requirement);
    }
  }
}
