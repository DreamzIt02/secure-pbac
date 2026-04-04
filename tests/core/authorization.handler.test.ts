import {
  AuthorizationHandler,
  AuthorizationHandlerWithResource,
  AuthorizationHandlerContext,
  AuthorizationFailureReason,
} from "../../src/core/index.js";
import { IAuthorizationRequirement, IAuthorizationHandler } from "../../src/core/types.js";

describe("AuthorizationHandler", () => {
  class TestRequirement implements IAuthorizationRequirement {
    toString() {
      return "TestRequirement";
    }
  }

  class TestHandler extends AuthorizationHandler<TestRequirement> {
    public handled: boolean = false;

    protected isRequirementType(requirement: IAuthorizationRequirement): boolean {
      return requirement instanceof TestRequirement;
    }

    protected async handleRequirementAsync(
      context: AuthorizationHandlerContext,
      requirement: TestRequirement
    ): Promise<void> {
      this.handled = true;
      context.succeed(requirement);
    }
  }

  it("should handle matching requirement type", async () => {
    const req = new TestRequirement();
    const ctx = new AuthorizationHandlerContext([req], { id: 1 });
    const handler = new TestHandler();

    await handler.handleAsync(ctx);

    expect(handler.handled).toBe(true);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("should skip non-matching requirement type", async () => {
    const nonMatchingReq: IAuthorizationRequirement = { toString: () => "Other" };
    const ctx = new AuthorizationHandlerContext([nonMatchingReq], { id: 2 });
    const handler = new TestHandler();

    await handler.handleAsync(ctx);

    expect(handler.handled).toBe(false);
    expect(ctx.hasSucceeded).toBe(false);
  });
});

describe("AuthorizationHandlerWithResource", () => {
  class ResourceRequirement implements IAuthorizationRequirement {
    toString() {
      return "ResourceRequirement";
    }
  }

  class ResourceHandler extends AuthorizationHandlerWithResource<ResourceRequirement, string> {
    public handled: boolean = false;

    protected isRequirementType(requirement: IAuthorizationRequirement): boolean {
      return requirement instanceof ResourceRequirement;
    }

    protected isResourceType(resource: any): resource is string {
      return typeof resource === "string";
    }

    protected async handleRequirementAsync(
      context: AuthorizationHandlerContext,
      requirement: ResourceRequirement,
      resource: string
    ): Promise<void> {
      this.handled = true;
      if (resource === "allow") {
        context.succeed(requirement);
      } else {
        context.fail(new AuthorizationFailureReason(this, "Resource denied"));
      }
    }
  }

  it("should handle requirement when resource type matches and succeed", async () => {
    const req = new ResourceRequirement();
    const ctx = new AuthorizationHandlerContext([req], { id: 3 }, "allow");
    const handler = new ResourceHandler();

    await handler.handleAsync(ctx);

    expect(handler.handled).toBe(true);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("should handle requirement when resource type matches and fail", async () => {
    const req = new ResourceRequirement();
    const ctx = new AuthorizationHandlerContext([req], { id: 4 }, "deny");
    
    const handler = new ResourceHandler();

    await handler.handleAsync(ctx);

    expect(handler.handled).toBe(true);
    expect(ctx.hasFailed).toBe(true);
    expect(ctx.failureReasons[0].message).toBe("Resource denied");
  });

  it("should skip handling when resource type does not match", async () => {
    const req = new ResourceRequirement();
    const ctx = new AuthorizationHandlerContext([req], { id: 5 }, 123); // not string
    const handler = new ResourceHandler();

    await handler.handleAsync(ctx);

    expect(handler.handled).toBe(false);
    expect(ctx.hasSucceeded).toBe(false);
    expect(ctx.hasFailed).toBe(false);
  });
});
