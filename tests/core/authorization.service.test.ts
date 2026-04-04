import {
  AuthorizationService,
  AuthorizationResult,
  AuthorizationOptions,
  AuthorizationFailure,
  AuthorizationFailureReason,
} from "../../src/core/index.js";
import {
  IAuthorizationRequirement,
  IAuthorizationHandler,
} from "../../src/core/types.js";

describe("AuthorizationService", () => {
  let policyProvider: any;
  let handlers: any;
  let logger: any;
  let contextFactory: any;
  let evaluator: any;
  let options: AuthorizationOptions;

  beforeEach(() => {
    policyProvider = {
      getPolicyAsync: vi.fn(),
    };
    handlers = {
      getHandlersAsync: vi.fn(),
    };
    logger = {
      userAuthorizationSucceeded: vi.fn(),
      userAuthorizationFailed: vi.fn(),
    };
    contextFactory = {
      createContext: vi.fn((reqs, user, resource) => ({
        requirements: reqs,
        User: user,
        Resource: resource,
        hasFailed: false,
        succeed: vi.fn(),
      })),
    };
    evaluator = {
      evaluate: vi.fn(),
    };
    options = { invokeHandlersAfterFailure: true } as AuthorizationOptions;
  });

  it("should throw if dependencies are null", () => {
    expect(
      () =>
        new AuthorizationService(
          null as any,
          handlers,
          logger,
          contextFactory,
          evaluator,
          options
        )
    ).toThrow("AuthorizationService dependencies cannot be null.");
  });

  it("should throw if requirements are null in authorizeAsync", async () => {
    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    await expect(service.authorizeAsync({}, {}, null as any)).rejects.toThrow(
      "Requirements cannot be null."
    );
  });

  it("should succeed when evaluator returns succeeded", async () => {
    const requirement: IAuthorizationRequirement = { toString: () => "Req" };
    const handler: IAuthorizationHandler = {
      handleAsync: vi.fn(),
    };
    handlers.getHandlersAsync.mockResolvedValue([handler]);
    evaluator.evaluate.mockReturnValue({ succeeded: true } as AuthorizationResult);

    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    const result = await service.authorizeAsync({}, {}, [requirement]);
    expect(result.succeeded).toBe(true);
    expect(logger.userAuthorizationSucceeded).toHaveBeenCalled();
  });

    it("should fail when evaluator returns failed", async () => {
    const requirement: IAuthorizationRequirement = { toString: () => "Req" };
    const handler: IAuthorizationHandler = { handleAsync: vi.fn() };

    handlers.getHandlersAsync.mockResolvedValue([]);
    evaluator.evaluate.mockReturnValue(
        AuthorizationResult.failed(
        AuthorizationFailure.failedWithReasons([
            new AuthorizationFailureReason(handler, "fail"),
        ])
        )
    );

    const service = new AuthorizationService(
        policyProvider,
        handlers,
        logger,
        contextFactory,
        evaluator,
        options
    );

    const result = await service.authorizeAsync({}, {}, [requirement]);
    expect(result.succeeded).toBe(false);

    // Assert that logger was called with an AuthorizationFailure object
    expect(logger.userAuthorizationFailed).toHaveBeenCalled();
    const failureArg = logger.userAuthorizationFailed.mock.calls[0][0];
    expect(failureArg.failureReasons[0].message).toBe("fail");
    });


  it("should stop invoking handlers after failure if option is false", async () => {
    options.invokeHandlersAfterFailure = false;
    const requirement: IAuthorizationRequirement = { toString: () => "Req" };
    const handler1: IAuthorizationHandler = {
      handleAsync: vi.fn(async (ctx: any) => {
        ctx.hasFailed = true;
      }),
    };
    const handler2: IAuthorizationHandler = {
      handleAsync: vi.fn(),
    };
    handlers.getHandlersAsync.mockResolvedValue([handler1, handler2]);
    evaluator.evaluate.mockReturnValue({ succeeded: false } as AuthorizationResult);

    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    await service.authorizeAsync({}, {}, [requirement]);
    expect(handler1.handleAsync).toHaveBeenCalled();
    expect(handler2.handleAsync).not.toHaveBeenCalled();
  });

  it("authorizePolicyAsync should call authorizeAsync with policy requirements", async () => {
    const requirement: IAuthorizationRequirement = { toString: () => "Req" };
    const policy = { requirements: [requirement] };
    policyProvider.getPolicyAsync.mockResolvedValue(policy);
    handlers.getHandlersAsync.mockResolvedValue([]);
    evaluator.evaluate.mockReturnValue({ succeeded: true } as AuthorizationResult);

    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    const result = await service.authorizePolicyAsync({}, {}, "policyName");
    expect(result.succeeded).toBe(true);
    expect(policyProvider.getPolicyAsync).toHaveBeenCalledWith("policyName");
  });

  it("getPolicyAsync should throw if policyName is null", async () => {
    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    await expect(service["getPolicyAsync"](null as any)).rejects.toThrow(
      "Policy name cannot be null."
    );
  });

  it("getPolicyAsync should throw if policy not found", async () => {
    policyProvider.getPolicyAsync.mockResolvedValue(null);
    const service = new AuthorizationService(
      policyProvider,
      handlers,
      logger,
      contextFactory,
      evaluator,
      options
    );
    await expect(service["getPolicyAsync"]("missing")).rejects.toThrow(
      "No policy found: missing."
    );
  });
});
