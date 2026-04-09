import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationFailureReason, AuthorizationHandlerContext } from "../../src/core/index.js";

// Simple mock requirement
class MockRequirement {}

// Simple mock handler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("AuthorizationHandlerContext", () => {
  const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
  const resource = { id: 123 };

  it("constructs with requirements, user, and resource", () => {
    const reqs = [new MockRequirement()];
    const ctx = new AuthorizationHandlerContext(reqs, user, resource);
    expect([...ctx.requirements]).toEqual(reqs);
    expect(ctx.user).toBe(user);
    expect(ctx.resource).toBe(resource);
    expect([...ctx.pendingRequirements]).toEqual(reqs);
    expect(ctx.failureReasons).toEqual([]);
    expect(ctx.hasFailed).toBe(false);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("succeed marks requirement as satisfied", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    ctx.succeed(req);
    expect([...ctx.pendingRequirements]).toEqual([]);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("fail sets hasFailed true and adds reason", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    const reason = new AuthorizationFailureReason(new MockHandler(), "Denied");
    ctx.fail(reason);
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.failureReasons.length).toBe(1);
    expect(ctx.failureReasons[0].message).toBe("Denied");
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("fail without reason sets hasFailed true but no failureReasons", () => {
    const ctx = new AuthorizationHandlerContext([new MockRequirement()], user, null);
    ctx.fail();
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.failureReasons).toEqual([]);
  });

  it("hasSucceeded returns false if not all requirements succeeded", () => {
    const req1 = new MockRequirement();
    const req2 = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req1, req2], user, null);
    ctx.succeed(req1);
    expect(ctx.hasSucceeded).toBe(false); // one requirement still pending
  });

  it("hasSucceeded returns false if fail was called", () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    ctx.succeed(req);
    ctx.fail();
    expect(ctx.hasSucceeded).toBe(false);
  });
});
