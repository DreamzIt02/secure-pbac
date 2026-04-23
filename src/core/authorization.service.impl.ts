import { ClaimsPrincipal } from "../claims/index.js";
import { Inject } from "../decorators/index.js";
import { Injectable } from "../decorators/inject.decorator.js";
import { ArgumentNullThrowHelper, InvalidOperationException } from "../types/exception.js";
import { IOptions } from "../types/index.js";
import { AuthorizationEvaluator, IAuthorizationEvaluator } from "./authorization.evaluator.js";
import { AuthorizationHandlerContextFactory, IAuthorizationHandlerContextFactory } from "./authorization.handler.context.factory.js";
import { AuthorizationHandlerProvider, IAuthorizationHandlerProvider } from "./authorization.handler.provider.js";
import { AuthorizationMetrics } from "./authorization.metrics.js";
import { AuthorizationOptions } from "./authorization.options.js";
import { AuthorizationPolicy } from "./authorization.policy.js";
import { AuthorizationPolicyProvider, IAuthorizationPolicyProvider } from "./authorization.policy.provider.js";
import { AuthorizationResult } from "./authorization.result.js";
import { IAuthorizationService } from "./authorization.service.js";
import { IAuthorizationRequirement } from "./types/index.js";

@Injectable()
export class AuthorizationService implements IAuthorizationService {
  authorizeAsync(user: ClaimsPrincipal, resource: object | null, requirements: Iterable<IAuthorizationRequirement>): Promise<AuthorizationResult>;
  authorizeAsync(user: ClaimsPrincipal, resource: object | null, policyName: string): Promise<AuthorizationResult>;
  authorizeAsync(user: unknown, resource: unknown, policyName: unknown): Promise<AuthorizationResult> {
    throw new Error("Method not implemented.");
  }
}
/**
 * The default implementation of an IAuthorizationService.
 */
export class DefaultAuthorizationService implements IAuthorizationService {
  private readonly options: AuthorizationOptions;
  private readonly contextFactory: IAuthorizationHandlerContextFactory;
  private readonly handlers: IAuthorizationHandlerProvider;
  private readonly evaluator: IAuthorizationEvaluator;
  private readonly policyProvider: IAuthorizationPolicyProvider;

  /**
   * Creates a new instance of DefaultAuthorizationService.
   * @param policyProvider The IAuthorizationPolicyProvider used to provide policies.
   * @param handlers The handlers used to fulfill IAuthorizationRequirement.
   * @param logger The logger used to log messages, warnings and errors.
   * @param contextFactory The IAuthorizationHandlerContextFactory used to create the context to handle the authorization.
   * @param evaluator The IAuthorizationEvaluator used to determine if authorization was successful.
   * @param options The AuthorizationOptions used.
   */
  constructor(
    @Inject(AuthorizationPolicyProvider) policyProvider: IAuthorizationPolicyProvider,
    @Inject(AuthorizationHandlerProvider) handlers     : IAuthorizationHandlerProvider,
    @Inject(AuthorizationHandlerContextFactory) factory: IAuthorizationHandlerContextFactory,
    @Inject(AuthorizationEvaluator) evaluator          : IAuthorizationEvaluator,
    @Inject(AuthorizationOptions) options              : IOptions<AuthorizationOptions>,
  ) {
    if (!options || !policyProvider || !handlers || !factory || !evaluator) {
      throw new Error('ArgumentNullException');
    }
    ArgumentNullThrowHelper.throwIfNull(options);
    ArgumentNullThrowHelper.throwIfNull(policyProvider);
    ArgumentNullThrowHelper.throwIfNull(handlers);
    ArgumentNullThrowHelper.throwIfNull(factory);
    ArgumentNullThrowHelper.throwIfNull(evaluator);

    this.options        = options.value;
    this.handlers       = handlers;
    this.policyProvider = policyProvider;
    this.evaluator      = evaluator;
    this.contextFactory = factory;
  }
  /**
   * Checks if a user meets a specific set of requirements for the specified resource.
   * @param user The user to evaluate the requirements against.
   * @param resource The resource to evaluate the requirements against.
   * @param requirements The requirements to evaluate.
   * @returns A Promise that contains an AuthorizationResult indicating whether authorization has succeeded.
   * The result's succeeded property is true when the user fulfills the policy; otherwise false.
   */
  public async authorizeAsync(user: ClaimsPrincipal, resource: object | null, requirements: Iterable<IAuthorizationRequirement>): Promise<AuthorizationResult>;
  /**
   * Checks if a user meets a specific authorization policy.
   * @param user The user to check the policy against.
   * @param resource The resource the policy should be checked with.
   * @param policyName The name of the policy to check against a specific context.
   * @returns A Promise that contains an AuthorizationResult indicating whether authorization has succeeded.
   * The result's succeeded property is true when the user fulfills the policy; otherwise false.
   */
  public async authorizeAsync(user: ClaimsPrincipal, resource: object | null, policyName: string): Promise<AuthorizationResult>;

  /**
   * Checks if a user meets a specific set of requirements for the specified resource.
   * @param user The user to evaluate the requirements against.
   * @param resource The resource to evaluate the requirements against.
   * @param requirements The requirements to evaluate.
   * @returns A Promise that contains an AuthorizationResult indicating whether authorization has succeeded.
   * The result's succeeded property is true when the user fulfills the policy; otherwise false.
   */
  public async authorizeAsync(user: ClaimsPrincipal, resource: object | null, requirements: Iterable<IAuthorizationRequirement> | string)
    : Promise<AuthorizationResult> {
    
    ArgumentNullThrowHelper.throwIfNull(requirements);
    
    if (typeof requirements === "string")
        return this._authorizeAsync(user, resource, requirements);

    const authContext = this.contextFactory.createContext(requirements, user, resource);
    const handlers    = await this.handlers.getHandlersAsync(authContext);

    for (const handler of handlers) {
      await handler.handleAsync(authContext);
      if (!this.options.invokeHandlersAfterFailure && authContext.hasFailed) {
        break;
      }
    }

    const result = this.evaluator.evaluate(authContext);
    if (result.succeeded) {
      console.log("this.logger.userAuthorizationSucceeded()");
    } else {
       console.log("this.logger.userAuthorizationFailed(result.failure)");
    }
    return result;
  }

  /**
   * Checks if a user meets a specific authorization policy.
   * @param user The user to check the policy against.
   * @param resource The resource the policy should be checked with.
   * @param policyName The name of the policy to check against a specific context.
   * @returns A Promise that contains an AuthorizationResult indicating whether authorization has succeeded.
   * The result's succeeded property is true when the user fulfills the policy; otherwise false.
   */
  protected async _authorizeAsync(user: ClaimsPrincipal, resource: object | null, policyName: string)
    : Promise<AuthorizationResult> {
    const policy = await this.getPolicyAsync(policyName);
    return await this.authorizeAsync(user, resource, policy);
  }

  // For use in DefaultAuthorizationServiceImpl.
  protected async getPolicyAsync(policyName: string): Promise<AuthorizationPolicy> {
    ArgumentNullThrowHelper.throwIfNull(policyName);
    const policy = await this.policyProvider.getPolicyAsync(policyName);
    if (!policy) {
      throw new InvalidOperationException(`No policy found: ${policyName}.`);
    }
    return policy;
  }
}

/**
 * Internal sealed implementation of DefaultAuthorizationService.
 */
export class DefaultAuthorizationServiceImpl extends DefaultAuthorizationService {
  private readonly metrics: AuthorizationMetrics;

  constructor(
    @Inject(AuthorizationPolicyProvider) policyProvider: IAuthorizationPolicyProvider,
    @Inject(AuthorizationHandlerProvider) handlers     : IAuthorizationHandlerProvider,
    @Inject(AuthorizationHandlerContextFactory) factory: IAuthorizationHandlerContextFactory,
    @Inject(AuthorizationEvaluator) evaluator          : IAuthorizationEvaluator,
    @Inject(AuthorizationOptions) options              : IOptions<AuthorizationOptions>,
    @Inject(AuthorizationMetrics) metrics              : AuthorizationMetrics
  ) {
    super(policyProvider, handlers, factory, evaluator, options);
    this.metrics = metrics;
  }
  public override async authorizeAsync(user: ClaimsPrincipal, resource: object | null, requirements: Iterable<IAuthorizationRequirement>): Promise<AuthorizationResult>;
  public override async authorizeAsync(user: ClaimsPrincipal, resource: object | null, policyName: string): Promise<AuthorizationResult>;

  public override async authorizeAsync(user: ClaimsPrincipal, resource: object | null, requirements: Iterable<IAuthorizationRequirement> | string)
    : Promise<AuthorizationResult> {
    if (typeof requirements === "string")
        return this._authorizeAsync(user, resource, requirements);

    let result: AuthorizationResult;
    try {
      result = await super.authorizeAsync(user, resource, requirements);
    } catch (ex) {
      this.metrics.authorizeAttemptCompleted(user, null, null, ex as any);
      throw ex;
    }
    this.metrics.authorizeAttemptCompleted(user, null, result, null);
    return result;
  }

  protected async _authorizeAsync(user: ClaimsPrincipal, resource: object | null, policyName: string)
    : Promise<AuthorizationResult> {
    let result: AuthorizationResult;
    try {
      const policy = await this.getPolicyAsync(policyName);
      // Deliberately call the base method of the other overload here
      result = await super.authorizeAsync(user, resource, policy.requirements);
    } catch (ex) {
      this.metrics.authorizeAttemptCompleted(user, policyName, null, ex as any);
      throw ex;
    }
    this.metrics.authorizeAttemptCompleted(user, policyName, result, null);
    return result;
  }
}
