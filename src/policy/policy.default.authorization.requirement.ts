import { AuthorizationHandler, AuthorizationHandlerContext, AuthorizationService, IAuthorizationService } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { HttpContextAccessor } from "../http/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { PolicyExpressionEvaluatorFactory, PolicyExpression } from "./policy.expression.evaluator.factory.js";

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
  
  // Implementation
  constructor(
    expressionFactory: () => PolicyExpression
  ) {
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    super();
    this.expressionFactory   = expressionFactory;
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
    const httpContext   = HttpContextAccessor.current;
    if (context.user && httpContext) {
      const scope       = httpContext.requestServices.createScope();
      const authService = scope.getRequiredService<IAuthorizationService>(AuthorizationService);

      const expr        = this.expressionFactory();
      const evaluator   = new PolicyExpressionEvaluatorFactory(authService);
      const authorized  = await evaluator.evaluatePolicies(expr, context.user, resource);

      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }
  
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
