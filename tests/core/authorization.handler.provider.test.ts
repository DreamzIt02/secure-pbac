// tests/core/authorization.handler.provider.test.ts

import { describe, it, expect } from "vitest";
import {
  DefaultAuthorizationHandlerProvider,
  AuthorizationHandlerContext,
} from "../../src/core/index.js";
import { IAuthorizationRequirement, IAuthorizationHandler } from "../../src/core/types.js";

class DummyRequirement implements IAuthorizationRequirement {
  toString() {
    return "DummyRequirement";
  }
}

class DummyHandler implements IAuthorizationHandler {
  constructor(private readonly requirement: IAuthorizationRequirement) {}

  async handleAsync(context: AuthorizationHandlerContext): Promise<void> {
    context.succeed(this.requirement);
  }
}

describe("DefaultAuthorizationHandlerProvider", () => {
  it("should throw if handlers are null", () => {
    expect(() => new DefaultAuthorizationHandlerProvider(null as any)).toThrow(
      "handlers cannot be null"
    );
  });

  it("should return handlers passed in constructor", async () => {
    const requirement = new DummyRequirement();
    const handler = new DummyHandler(requirement);
    const provider = new DefaultAuthorizationHandlerProvider([handler]);

    const ctx = new AuthorizationHandlerContext([requirement], { name: "alice" }, null);
    const handlers = await provider.getHandlersAsync(ctx);

    expect(handlers).toContain(handler);
    expect(handlers.length).toBe(1);
  });

  it("should support multiple handlers", async () => {
    const requirement1 = new DummyRequirement();
    const requirement2 = new DummyRequirement();
    const handler1 = new DummyHandler(requirement1);
    const handler2 = new DummyHandler(requirement2);
    const provider = new DefaultAuthorizationHandlerProvider([handler1, handler2]);

    const ctx = new AuthorizationHandlerContext([requirement1, requirement2], { name: "bob" }, "res");
    const handlers = await provider.getHandlersAsync(ctx);

    expect(handlers).toEqual(expect.arrayContaining([handler1, handler2]));
    expect(handlers.length).toBe(2);
  });

  it("should allow handlers to execute against context", async () => {
    const requirement = new DummyRequirement();
    const handler = new DummyHandler(requirement);
    const provider = new DefaultAuthorizationHandlerProvider([handler]);

    const ctx = new AuthorizationHandlerContext([requirement], { name: "carol" }, null);
    const handlers = await provider.getHandlersAsync(ctx);

    // Execute handler
    await handlers[0].handleAsync(ctx);

    expect(ctx.hasSucceeded).toBe(true);
    expect(ctx.pendingRequirements.length).toBe(0);
  });
});
