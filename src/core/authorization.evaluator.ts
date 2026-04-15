

import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { AuthorizationResult } from "./authorization.result.js";
import { AuthorizationFailure } from "./authorization.failure.js";

export interface IAuthorizationEvaluator {
  evaluate(context: AuthorizationHandlerContext): AuthorizationResult;
}

/**
 * Default evaluator that inspects the AuthorizationHandlerContext
 * and produces an AuthorizationResult.
 */
export class DefaultAuthorizationEvaluator implements IAuthorizationEvaluator {
  public evaluate(context: AuthorizationHandlerContext): AuthorizationResult {
    if (context.hasSucceeded) {
      return AuthorizationResult.success();
    }

    if (context.hasFailed) {
      // If there are explicit failure reasons, use them
      if (context.failureReasons && context.failureReasons.length > 0) {
        return AuthorizationResult.failed(
          AuthorizationFailure.failed(context.failureReasons)
        );
      }

      // Otherwise, fail with the failed requirements
      return AuthorizationResult.failed(
        AuthorizationFailure.failed([...(context.pendingRequirements ?? [])])
      );
    }

    // If neither succeeded nor failed, treat pending requirements as failure
    return AuthorizationResult.failed(
      AuthorizationFailure.failed([...(context.pendingRequirements ?? [])])
    );
  }
}
