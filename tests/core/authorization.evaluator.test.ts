import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationFailureReason, AuthorizationHandlerContext, DefaultAuthorizationEvaluator } from "../../src/core/index.js";


// Mock requirement
class MockRequirement {}

// Mock handler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("DefaultAuthorizationEvaluator", () => {
  const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));

  it("returns success when context.hasSucceeded is true", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    ctx.succeed(req); // mark requirement succeeded
    const evaluator = new DefaultAuthorizationEvaluator();
    const result = evaluator.evaluate(ctx);
    expect(result.succeeded).toBe(true);
    expect(result.failure).toBeUndefined();
  });

  it("returns failed with reasons when context.hasFailed and failureReasons exist", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    const reason = new AuthorizationFailureReason(new MockHandler(), "Denied");
    ctx.fail(reason);
    const evaluator = new DefaultAuthorizationEvaluator();
    const result = evaluator.evaluate(ctx);
    expect(result.succeeded).toBe(false);
    expect(result.failure?.failureReasons[0].message).toBe("Denied");
  });

  it("returns failed with requirements when context.hasFailed but no reasons", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    ctx.fail(); // fail without reason
    const evaluator = new DefaultAuthorizationEvaluator();
    const result = evaluator.evaluate(ctx);
    expect(result.succeeded).toBe(false);
    expect(result.failure?.failedRequirements.length).toBe(1);
  });

  it("returns failed with pending requirements when neither succeeded nor failed", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    const evaluator = new DefaultAuthorizationEvaluator();
    const result = evaluator.evaluate(ctx);
    expect(result.succeeded).toBe(false);
    expect(result.failure?.failedRequirements.length).toBe(1);
  });
});
