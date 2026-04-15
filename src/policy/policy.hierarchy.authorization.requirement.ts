import { AllowedPrimaryKeysSafe } from "../contexts/index.js";
import { AuthorizationHandler, AuthorizationHandlerContext } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { IPolicyAuthorizationService } from "./policy.authorization.service.js";
import { ClaimExpression, IPolicyExpressionEvaluatorFactory, PolicyExpressionEvaluatorFactory} from "./policy.expression.evaluator.factory.js";

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
  private readonly expressionEvaluator: IPolicyExpressionEvaluatorFactory;
  
  // Implementation
  constructor(
    policies         : Iterable<string>, 
    expressionFactory: () => ClaimExpression,
    authService      : IPolicyAuthorizationService<TKey>,
  ) {
    ArgumentNullThrowHelper.throwIfNull(policies);
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    ArgumentNullThrowHelper.throwIfNull(authService);
    super();
    this.policies            = policies;
    this.expressionFactory   = expressionFactory;
    this.expressionEvaluator = new PolicyExpressionEvaluatorFactory(undefined, authService);
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
    if (context.user) {
      const expr       = this.expressionFactory();
      const authorized = await this.expressionEvaluator.evaluateHierarchy(expr, context.user, resource, requirement.policies);

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
