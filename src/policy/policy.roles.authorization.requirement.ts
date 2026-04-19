import { AuthorizationHandler, AuthorizationHandlerContext } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { PolicyExpressionEvaluatorFactory, RoleExpression } from "./policy.expression.evaluator.factory.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's PolicyRolesAuthorizationRequirement.
 */
export class PolicyRolesAuthorizationRequirement
  extends AuthorizationHandler<PolicyRolesAuthorizationRequirement>
  implements IAuthorizationRequirement
{
  private readonly expressionFactory  : () => RoleExpression;
  
  // Implementation
  constructor(expressionFactory: () => RoleExpression) {
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    super();
    this.expressionFactory   = expressionFactory;
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyRolesAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyRolesAuthorizationRequirement,
    resource   : object
  ): Promise<void>;

  // Implementation
  protected override async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyRolesAuthorizationRequirement,
    resource?  : object
  ): Promise<void> {
    if (context.user) {
      const expr       = this.expressionFactory();
      const evaluator  = new PolicyExpressionEvaluatorFactory();
      const authorized = await evaluator.evaluateRoles(expr, context.user, resource);
      
      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }
  
  /**
   * Type guard to check if the requirement is of type PolicyRolesAuthorizationRequirement.
   */
  protected override isRequirementType(requirement: IAuthorizationRequirement): requirement is PolicyRolesAuthorizationRequirement {
    return requirement instanceof PolicyRolesAuthorizationRequirement;
  }
}

// OR example
const requirement1 = new PolicyRolesAuthorizationRequirement(() => ({
  or: [
    "role1",
    "role2",
  ]
}));

// AND example
const requirement2 = new PolicyRolesAuthorizationRequirement(() => ({
  and: [
    "role1",
    "role2",
  ]
}));

// Example: (expr1 OR expr2) AND (expr3 OR expr4)
const requirement3 = new PolicyRolesAuthorizationRequirement(() => ({
  and: [
    { or: [
        "role1",
        "role2",
      ]
    },
    { or: [
        "role3",
        "role4",
      ]
    }
  ]
}));
