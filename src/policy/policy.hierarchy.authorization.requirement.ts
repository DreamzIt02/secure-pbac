import { AllowedPrimaryKeysSafe } from "../contexts/index.js";
import { AuthorizationHandler, AuthorizationHandlerContext, AuthorizationService, IAuthorizationService } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { HttpContextAccessor } from "../http/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { PolicyAuthorizationService } from "./policy.authorization.service.impl.js";
import { IPolicyAuthorizationService } from "./policy.authorization.service.js";
import { ClaimExpression, PolicyExpressionEvaluatorFactory} from "./policy.expression.evaluator.factory.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's PolicyHierarchyAuthorizationRequirement.
 */
export class PolicyHierarchyAuthorizationRequirement<TKey  extends AllowedPrimaryKeysSafe>
  extends AuthorizationHandler<PolicyHierarchyAuthorizationRequirement<TKey>>
  implements IAuthorizationRequirement
{
  private readonly policies           : Iterable<string>;
  private readonly expressionFactory  : () => ClaimExpression;
  
  // Implementation
  constructor(
    policies         : Iterable<string>, 
    expressionFactory: () => ClaimExpression,
  ) {
    ArgumentNullThrowHelper.throwIfNull(policies);
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    super();
    this.policies            = policies;
    this.expressionFactory   = expressionFactory;
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyHierarchyAuthorizationRequirement<TKey>
  ): Promise<void>;
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyHierarchyAuthorizationRequirement<TKey>,
    resource   : object
  ): Promise<void>;

  // Implementation
  protected override async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyHierarchyAuthorizationRequirement<TKey>,
    resource?  : object
  ): Promise<void> {
    const httpContext   = HttpContextAccessor.current;
    if (context.user && httpContext) {
      const scope       = httpContext.requestServices.createScope();
      const authService = scope.getRequiredService<IAuthorizationService>(AuthorizationService);
      const policyService = scope.getRequiredService<IPolicyAuthorizationService<any, any>>(PolicyAuthorizationService);
      
      const expr        = this.expressionFactory();
      const evaluator   = new PolicyExpressionEvaluatorFactory(authService, policyService);
      const authorized  = await evaluator.evaluateHierarchy(expr, context.user, resource, requirement.policies);

      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }

  /**
   * Type guard to check if the requirement is of type PolicyHierarchyAuthorizationRequirement.
   */
  protected override isRequirementType(requirement: IAuthorizationRequirement): requirement is PolicyHierarchyAuthorizationRequirement<TKey> {
    return requirement instanceof PolicyHierarchyAuthorizationRequirement;
  }
}

// OR example
// const requirement1 = new PolicyHierarchyAuthorizationRequirement(() => ({
//   or: [
//     "policy1",
//     "policy2",
//   ]
// }));

// // AND example
// const requirement2 = new PolicyHierarchyAuthorizationRequirement(() => ({
//   and: [
//     "policy1",
//     "policy2",
//   ]
// }));

// Example: (expr1 OR expr2) AND (expr3 OR expr4)
// const requirement3 = new PolicyHierarchyAuthorizationRequirement(() => ({
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
