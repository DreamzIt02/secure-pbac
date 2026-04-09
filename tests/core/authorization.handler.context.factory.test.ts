import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationHandlerContext, DefaultAuthorizationHandlerContextFactory } from "../../src/core/index.js";


// Mock requirement
class MockRequirement {}

describe("DefaultAuthorizationHandlerContextFactory", () => {
  const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
  const resource = { id: 42 };

  it("creates AuthorizationHandlerContext with requirements, user, and resource", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const reqs = [new MockRequirement()];
    const ctx = factory.createContext(reqs, user, resource);

    expect(ctx).toBeInstanceOf(AuthorizationHandlerContext);
    expect([...ctx.requirements]).toEqual(reqs);
    expect(ctx.user).toBe(user);
    expect(ctx.resource).toBe(resource);
  });

  it("freezes requirements array to prevent modification", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const reqs = [new MockRequirement()];
    const ctx = factory.createContext(reqs, user, null);

    const frozenReqs = ctx.requirements as any;
    expect(Object.isFrozen(frozenReqs)).toBe(true);

    // Attempting to modify should throw
    expect(() => frozenReqs.push(new MockRequirement())).toThrow();
  });

  it("creates context with empty requirements", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const ctx = factory.createContext([], user, null);

    expect([...ctx.requirements]).toEqual([]);
    expect(ctx.user).toBe(user);
    expect(ctx.resource).toBeNull();
  });
});
