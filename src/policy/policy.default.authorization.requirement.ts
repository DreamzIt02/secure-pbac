import { AuthorizationHandler, AuthorizationHandlerContext, IAuthorizationService } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { IPolicyClaimsExpressionEvaluator, PolicyClaimsExpressionEvaluator, PolicyExpression } from "./policy.expression.evaluator.factory.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's PolicyDefaultAuthorizationRequirement.
 */
export class PolicyDefaultAuthorizationRequirement
  extends AuthorizationHandler<PolicyDefaultAuthorizationRequirement>
  implements IAuthorizationRequirement
{
  private readonly expressionFactory  : () => PolicyExpression;
  private readonly expressionEvaluator: IPolicyClaimsExpressionEvaluator;
  
  // Implementation
  constructor(
    expressionFactory: () => PolicyExpression, 
    authService      : IAuthorizationService,
  ) {
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    ArgumentNullThrowHelper.throwIfNull(authService);
    super();
    this.expressionFactory   = expressionFactory;
    this.expressionEvaluator = new PolicyClaimsExpressionEvaluator(authService);
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyDefaultAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyDefaultAuthorizationRequirement,
    resource   : object
  ): Promise<void>;

  // Implementation
  protected override async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyDefaultAuthorizationRequirement,
    resource?  : object
  ): Promise<void> {
    if (context.user) {
      const expr       = this.expressionFactory();
      const authorized = await this.expressionEvaluator.evaluatePolicies(expr, context.user, resource);

      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }
  
  // private async evaluateExpression(expr: PolicyExpression, user: ClaimsPrincipal, resource?: object): Promise<boolean> {
  //   if (typeof expr === "string") {
  //     // Resolve named policy
  //     const result = await this.authService.authorizeAsync(user, resource ?? null, expr);
  //     // if (!policy) return false;
  //     // Evaluate all requirements in the policy
  //     // for (const requirement of policy.requirements) {
  //     //   const innerContext = new AuthorizationHandlerContext([requirement], user, null);
  //     //   const handlers = await this.policyHandler.getHandlersAsync(innerContext);

  //     //   for (const handler of handlers) {
  //     //     await handler.handleAsync(innerContext);
  //     //     if (innerContext.hasFailed) {
  //     //       break;
  //     //     }
  //     //   }
        
  //     //   if (!innerContext.hasSucceeded) {
  //     //     return false;
  //     //   }
  //     // }
  //     return result.succeeded;
  //   }
  //   if ("and" in expr) {
  //     for (const e of expr.and) {
  //       if (!(await this.evaluateExpression(e, user))) return false;
  //     }
  //     return true;
  //   }
  //   if ("or" in expr) {
  //     for (const e of expr.or) {
  //       if (await this.evaluateExpression(e, user)) return true;
  //     }
  //     return false;
  //   }
  //   return false;
  // }
  
  /**
   * Type guard to check if the requirement is of type PolicyDefaultAuthorizationRequirement.
   */
  protected override isRequirementType(requirement: IAuthorizationRequirement): requirement is PolicyDefaultAuthorizationRequirement {
    return requirement instanceof PolicyDefaultAuthorizationRequirement;
  }
}

// OR example
// const requirement1 = new PolicyDefaultAuthorizationRequirement(() => ({
//   or: [
//     "policy1",
//     "policy2",
//   ]
// }));

// // AND example
// const requirement2 = new PolicyDefaultAuthorizationRequirement(() => ({
//   and: [
//     "policy1",
//     "policy2",
//   ]
// }));

// Example: (expr1 OR expr2) AND (expr3 OR expr4)
// const requirement3 = new PolicyDefaultAuthorizationRequirement(() => ({
//   and: [
//     { or: [
//         "policy1",
//         "policy2",
//       ]
//     },
//     { or: [
//         "policy3",
//         "policy4",
//       ]
//     }
//   ]
// }));
