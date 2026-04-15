import { Claim } from "../claims/index.js";
import { AuthorizationHandler, AuthorizationHandlerContext } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { ClaimExpression, IPolicyExpressionEvaluatorFactory, PolicyExpressionEvaluatorFactory} from "./policy.expression.evaluator.factory.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * which requires at least one instance of the specified claim type, and,
 * if allowed values are specified, the claim value must be any of the allowed values.
 *
 * Mirrors ASP.NET Core's PolicyClaimsAuthorizationRequirement.
 */
export class PolicyClaimsAuthorizationRequirement
  extends AuthorizationHandler<PolicyClaimsAuthorizationRequirement>
  implements IAuthorizationRequirement
{
  private readonly expressionFactory  : () => ClaimExpression;
  private readonly expressionEvaluator: IPolicyExpressionEvaluatorFactory;

  // Implementation
  constructor(expressionFactory: () => ClaimExpression) {
    ArgumentNullThrowHelper.throwIfNull(expressionFactory);
    super();
    this.expressionFactory   = expressionFactory;
    this.expressionEvaluator = new PolicyExpressionEvaluatorFactory();
  }

  // Overload signatures to satisfy base class
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyClaimsAuthorizationRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyClaimsAuthorizationRequirement,
    resource   : object
  ): Promise<void>;

  // Implementation
  protected override async handleRequirementAsync(
    context    : AuthorizationHandlerContext,
    requirement: PolicyClaimsAuthorizationRequirement,
    resource?  : object
  ): Promise<void> {
    if (context.user) {
      const expr       = this.expressionFactory();
      const authorized = await this.expressionEvaluator.evaluateClaims(expr, context.user, resource);
      
      if (authorized.succeeded) {
        context.succeed(requirement);
      }
    }
    return Promise.resolve();
  }
  
  /**
   * Type guard to check if the requirement is of type PolicyClaimsAuthorizationRequirement.
   */
  protected override isRequirementType(requirement: IAuthorizationRequirement): requirement is PolicyClaimsAuthorizationRequirement {
    return requirement instanceof PolicyClaimsAuthorizationRequirement;
  }
}

// OR example
const requirement1 = new PolicyClaimsAuthorizationRequirement(() => ({
  or: [
    new Claim("claim_type_1", "claim_value_1"),
    new Claim("claim_type_2", "claim_value_2"),
  ]
}));

// AND example
const requirement2 = new PolicyClaimsAuthorizationRequirement(() => ({
  and: [
    new Claim("claim_type_1", "claim_value_1"),
    new Claim("claim_type_2", "claim_value_2"),
  ]
}));

// Example: (expr1 OR expr2) AND (expr3 OR expr4)
const requirement3 = new PolicyClaimsAuthorizationRequirement(() => ({
  and: [
    { or: [
        new Claim("claim_type_1", "claim_value_1"),
        new Claim("claim_type_2", "claim_value_2"),
      ]
    },
    { or: [
        new Claim("claim_type_3", "claim_value_3"),
        new Claim("claim_type_4", "claim_value_4"),
      ]
    }
  ]
}));
