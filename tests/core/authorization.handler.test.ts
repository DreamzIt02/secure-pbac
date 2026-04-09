import { describe, it, expect } from "vitest";
import { AuthorizationHandler, AuthorizationHandlerContext } from "../../src/core/index.js";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";


// Mock requirement
class MockRequirement {}

// Concrete handler for requirement-only
class RequirementOnlyHandler extends AuthorizationHandler<MockRequirement> {
  protected isRequirementType(req: any): req is MockRequirement {
    return req instanceof MockRequirement;
  }
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement,
    resource?: object | null
  ): Promise<void>;
  
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement,
    resource?: object | null
  ): Promise<void> {
    context.succeed(requirement);
  }
}

// Concrete handler for requirement + resource
class RequirementWithResourceHandler extends AuthorizationHandler<MockRequirement, object> {
  protected isRequirementType(req: any): req is MockRequirement {
    return req instanceof MockRequirement;
  }
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement
  ): Promise<void>;
protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement,
    resource: object
  ): Promise<void>;
  protected async handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: MockRequirement,
    resource?: object | null
  ): Promise<void> {
    // succeed only if resource has expected property
    if (resource && (resource as any).allow) {
      context.succeed(requirement);
    } else if (resource) {
      context.fail();
    } else {
      context.succeed(requirement);
    }
  }
}

describe("AuthorizationHandler", () => {
  const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));

  it("RequirementOnlyHandler succeeds when requirement is matched", async () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    const handler = new RequirementOnlyHandler();
    await handler.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("RequirementWithResourceHandler succeeds when resource allows", async () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, { allow: true });
    const handler = new RequirementWithResourceHandler();
    await handler.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("RequirementWithResourceHandler fails when resource disallows", async () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, { allow: false });
    const handler = new RequirementWithResourceHandler();
    await handler.handleAsync(ctx);
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("RequirementWithResourceHandler falls back to requirement-only overload when resource is undefined", async () => {
    const req = new MockRequirement();
    const ctx = new AuthorizationHandlerContext([req], user, null);
    const handler = new RequirementWithResourceHandler();
    await handler.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("ignores non-matching requirements", async () => {
    const ctx = new AuthorizationHandlerContext([{} as any], user, null);
    const handler = new RequirementOnlyHandler();
    await handler.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });
});
