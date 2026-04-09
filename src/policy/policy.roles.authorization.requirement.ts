import { AuthorizationHandler, AuthorizationHandlerContext } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { IPolicyClaimsExpressionEvaluator, PolicyClaimsExpressionEvaluator, RoleExpression } from "./policy.expression.evaluator.factory.js";

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
  private readonly expressionEvaluator: IPolicyClaimsExpressionEvaluator;
  
  // Implementation
  constructor(expressionFactory: () => RoleExpression) {
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    super();
    this.expressionFactory   = expressionFactory;
    this.expressionEvaluator = new PolicyClaimsExpressionEvaluator();
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
      const authorized = await this.expressionEvaluator.evaluateRoles(expr, context.user, resource);
      
      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }
  
  // private evaluateExpression(expr: RoleExpression, user: ClaimsPrincipal): boolean {
  //   if (typeof expr === "string") {
  //     return user.isInRole(expr);
  //   }
  //   if ("and" in expr) {
  //     return expr.and.every(e => this.evaluateExpression(e, user));
  //   }
  //   if ("or" in expr) {
  //     return expr.or.some(e => this.evaluateExpression(e, user));
  //   }
  //   return false;
  // }

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
