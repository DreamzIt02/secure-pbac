import { describe, it, expect, vi } from "vitest";
import { AuthorizationHandlerContext, AuthorizationMetrics, AuthorizationOptions, AuthorizationPolicy, AuthorizationResult, DefaultAuthorizationService, DefaultAuthorizationServiceImpl, IAuthorizationPolicyProvider, Meter } from "../../src/core/index.js";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { InvalidOperationException } from "../../src/types/exception.js";
import { IAuthorizationRequirement } from "../../src/core/types/index.js";


// Simple mock requirement
const mockRequirement = {};

// Mock handler that succeeds
const mockHandler = {
  handleAsync: vi.fn(async ctx => {
    ctx.succeed(mockRequirement);
  })
};

// Mock contextFactory
const mockContextFactory = {
  createContext: vi.fn(
    (reqs: Iterable<IAuthorizationRequirement>, user: ClaimsPrincipal, resource: object | null) => {
      // Return a real AuthorizationHandlerContext so it matches the expected type
      return new AuthorizationHandlerContext([...reqs], user, resource);
    }
  )
};

// Mock evaluator
const mockEvaluator = {
  evaluate: vi.fn(ctx => {
    return ctx.hasSucceeded ? AuthorizationResult.success() : AuthorizationResult.failedDefault();
  })
};

// Mock handlers provider
const mockHandlersProvider = {
  getHandlersAsync: vi.fn(async () => [mockHandler])
};

// Mock policy provider
const mockPolicyProvider: IAuthorizationPolicyProvider = {
  getPolicyAsync: vi.fn(async (name: string) => {
    if (name === "known") {
      return new AuthorizationPolicy([mockRequirement], []);
    }
    return null;
  }),
  getDefaultPolicyAsync: vi.fn(async () => new AuthorizationPolicy([mockRequirement], [])),
  getFallbackPolicyAsync: vi.fn(async () => null),
  allowsCachingPolicies: true
};

// Mock meter factory
const mockMeterFactory = {
  create: (name: string) => {
    return {
      createCounter: () => ({
        enabled: true,
        add: vi.fn()
      })
    } as unknown as Meter;
  }
};

describe("DefaultAuthorizationService", () => {
  const options = { value: new AuthorizationOptions() };

  it("throws if constructor args are null", () => {
    expect(() => new DefaultAuthorizationService(null as any, mockHandlersProvider, mockContextFactory, mockEvaluator, options))
      .toThrow("ArgumentNullException");
  });

  it("authorizeAsync with requirements succeeds", async () => {
    const service = new DefaultAuthorizationService(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    const result = await service.authorizeAsync(user, null, [mockRequirement]);
    expect(result.succeeded).toBe(true);
  });

  it("authorizeAsync with requirements fails when evaluator fails", async () => {
    const failingEvaluator = { evaluate: () => AuthorizationResult.failedDefault() };
    const service = new DefaultAuthorizationService(mockPolicyProvider, mockHandlersProvider, mockContextFactory, failingEvaluator, options);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")]));
    const result = await service.authorizeAsync(user, null, [mockRequirement]);
    expect(result.succeeded).toBe(false);
  });

  it("authorizeAsync with policyName succeeds", async () => {
    const service = new DefaultAuthorizationService(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    const result = await service.authorizeAsync(user, null, "known");
    expect(result.succeeded).toBe(true);
  });

  it("getPolicyAsync throws if policy not found", async () => {
    const service = new DefaultAuthorizationService(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options);
    await expect(service["getPolicyAsync"]("missing")).rejects.toThrow(InvalidOperationException);
  });

  it("stops handlers early when invokeHandlersAfterFailure is false", async () => {
    const options2 = { value: new AuthorizationOptions() };
    options2.value.invokeHandlersAfterFailure = false;
    const failingHandler = { handleAsync: vi.fn(async ctx => ctx.fail()) };
    const handlersProvider = { getHandlersAsync: async () => [failingHandler, mockHandler] };
    const service = new DefaultAuthorizationService(mockPolicyProvider, handlersProvider, mockContextFactory, mockEvaluator, options2);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    const result = await service.authorizeAsync(user, null, [mockRequirement]);
    expect(result.succeeded).toBe(false);
    expect(failingHandler.handleAsync).toHaveBeenCalled();
  });
});

describe("DefaultAuthorizationServiceImpl", () => {
  const options = { value: new AuthorizationOptions() };
const metrics = new AuthorizationMetrics(mockMeterFactory);

  it("authorizeAsync with requirements records metrics", async () => {
    const service = new DefaultAuthorizationServiceImpl(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options, metrics);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    const result = await service.authorizeAsync(user, null, [mockRequirement]);
    expect(result.succeeded).toBe(true);
  });

  it("authorizeAsync with policyName records metrics", async () => {
    const service = new DefaultAuthorizationServiceImpl(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options, metrics);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    const result = await service.authorizeAsync(user, null, "known");
    expect(result.succeeded).toBe(true);
  });

  it("authorizeAsync with policyName throws and records metrics when policy missing", async () => {
    const service = new DefaultAuthorizationServiceImpl(mockPolicyProvider, mockHandlersProvider, mockContextFactory, mockEvaluator, options, metrics);
    const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
    await expect(service.authorizeAsync(user, null, "missing")).rejects.toThrow(InvalidOperationException);
  });
});
