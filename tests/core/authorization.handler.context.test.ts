import { AuthorizationHandlerContext } from "../../src/core/index.js";
import { IAuthorizationRequirement, IAuthorizationHandler } from "../../src/core/types.js";
import { AuthorizationFailureReason } from "../../src/core/index.js";

describe("AuthorizationHandlerContext", () => {
  const requirement: IAuthorizationRequirement = { toString: () => "req1" };
  const requirement2: IAuthorizationRequirement = { toString: () => "req2" };

  it("should throw if requirements are null", () => {
    expect(() => new AuthorizationHandlerContext(null as any, {})).toThrow("requirements cannot be null");
  });

  it("should initialize with requirements, user, and resource", () => {
    const ctx = new AuthorizationHandlerContext([requirement], { id: 1 }, "resourceX");
    expect(ctx.requirements).toEqual([requirement]);
    expect(ctx.user).toEqual({ id: 1 });
    expect(ctx.resource).toBe("resourceX");
    expect(ctx.pendingRequirements).toEqual([requirement]);
    expect(ctx.failureReasons).toEqual([]);
    expect(ctx.hasFailed).toBe(false);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("should mark requirement as succeeded", () => {
    const ctx = new AuthorizationHandlerContext([requirement, requirement2], { id: 2 });
    ctx.succeed(requirement);
    expect(ctx.pendingRequirements).toEqual([requirement2]);
    expect(ctx.hasSucceeded).toBe(false); // still one pending
    ctx.succeed(requirement2);
    expect(ctx.pendingRequirements).toEqual([]);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("should mark as failed", () => {
    const ctx = new AuthorizationHandlerContext([requirement], {});
    ctx.fail();
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("should mark as failed with reason", () => {
    const handler: IAuthorizationHandler = { handleAsync: async () => {} };
    const reason = new AuthorizationFailureReason(handler, "Denied");
    const ctx = new AuthorizationHandlerContext([requirement], {});
    ctx.fail(reason);
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.failureReasons[0].message).toBe("Denied");
  });

  it("should not add reason if null", () => {
    const ctx = new AuthorizationHandlerContext([requirement], {});
    ctx.fail(null as any);
    expect(ctx.failureReasons).toEqual([]);
  });
});
