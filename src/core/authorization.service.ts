// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { DefaultAuthorizationPolicyProvider, IAuthorizationPolicyProvider } from "./authorization.policy.provider.js";
import { AuthorizationOptions } from "./authorization.options.js";
import { IAuthorizationRequirement } from "./types.js";
import { AuthorizationResult } from "./authorization.result.js";
import { DefaultAuthorizationEvaluator, IAuthorizationEvaluator } from "./authorization.evaluator.js";
import { DefaultAuthorizationHandlerContextFactory, IAuthorizationHandlerContextFactory } from "./authorization.handler.context.factory.js";
import { DefaultAuthorizationHandlerProvider, IAuthorizationHandlerProvider } from "./authorization.handler.provider.js";
import { DefaultAuthorizationLogger, IAuthorizationLogger } from "./authorization.logger.js";

/**
 * Checks policy-based permissions for a user.
 *
 * Provides programmatic configuration used by authorization services and policy providers.
 */
export class AuthorizationService {
  private options: AuthorizationOptions;
  private policyProvider: IAuthorizationPolicyProvider;
  private handlers: IAuthorizationHandlerProvider;
  private contextFactory: IAuthorizationHandlerContextFactory;
  private evaluator: IAuthorizationEvaluator;
  private logger: IAuthorizationLogger;

  /**
   * Creates a new instance of AuthorizationService.
   * @param policyProvider The provider used to supply policies.
   * @param handlers The handlers used to fulfill IAuthorizationRequirement instances.
   * @param logger The logger used to log messages, warnings and errors.
   * @param contextFactory The factory used to create the context to handle authorization.
   * @param evaluator The evaluator used to determine if authorization was successful.
   * @param options The options used to configure this instance.
   */
  constructor(
    policyProvider: DefaultAuthorizationPolicyProvider,
    handlers: DefaultAuthorizationHandlerProvider,
    logger: DefaultAuthorizationLogger,
    contextFactory: DefaultAuthorizationHandlerContextFactory,
    evaluator: DefaultAuthorizationEvaluator,
    options: AuthorizationOptions
  ) {
    if (!policyProvider || !handlers || !logger || !contextFactory || !evaluator || !options) {
      throw new Error("AuthorizationService dependencies cannot be null.");
    }

    this.policyProvider = policyProvider;
    this.handlers = handlers;
    this.logger = logger;
    this.contextFactory = contextFactory;
    this.evaluator = evaluator;
    this.options = options;
  }

  /**
   * Checks if a user meets a specific set of requirements for the specified resource.
   * @param user The user to evaluate the requirements against.
   * @param resource The resource to evaluate the requirements against.
   * @param requirements The requirements to evaluate.
   * @returns A Promise that resolves to an AuthorizationResult indicating whether authorization has succeeded.
   * The result's `succeeded` property is true when the user fulfills the policy; otherwise false.
   */
  public async authorizeAsync(user: any, resource: any, requirements: readonly IAuthorizationRequirement[]): Promise<AuthorizationResult> {
    if (!requirements) {
      throw new Error("Requirements cannot be null.");
    }

    const authContext = this.contextFactory.createContext(requirements, user, resource);
    const handlers = await this.handlers.getHandlersAsync(authContext);
    for (const handler of handlers) {
      await handler.handleAsync(authContext);
      if (!this.options.invokeHandlersAfterFailure && authContext.hasFailed) {
        break;
      }
    }

    const result = this.evaluator.evaluate(authContext);
    if (result.succeeded) {
      this.logger.userAuthorizationSucceeded();
    } else {
      this.logger.userAuthorizationFailed(result.failure);
    }
    return result;
  }

  /**
   * Checks if a user meets a specific authorization policy.
   * @param user The user to check the policy against.
   * @param resource The resource the policy should be checked with.
   * @param policyName The name of the policy to check against a specific context.
   * @returns A Promise that resolves to an AuthorizationResult indicating whether authorization has succeeded.
   * The result's `succeeded` property is true when the policy has been fulfilled; otherwise false.
   */
  public async authorizePolicyAsync(user: any, resource: any, policyName: string): Promise<AuthorizationResult> {
    const policy = await this.getPolicyAsync(policyName);
    return await this.authorizeAsync(user, resource, policy.requirements);
  }

  /**
   * Retrieves a policy by name.
   * @param policyName The name of the policy.
   * @returns A Promise resolving to the AuthorizationPolicy, or throws if not found.
   */
  private async getPolicyAsync(policyName: string) {
    if (!policyName) {
      throw new Error("Policy name cannot be null.");
    }
    const policy = await this.policyProvider.getPolicyAsync(policyName);
    if (!policy) {
      throw new Error(`No policy found: ${policyName}.`);
    }
    return policy;
  }
}
