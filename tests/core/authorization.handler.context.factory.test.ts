// tests/core/authorization.handler.context.factory.test.ts

import { describe, it, expect } from "vitest";
import {
  DefaultAuthorizationHandlerContextFactory,
  IAuthorizationHandlerContextFactory,
  AuthorizationHandlerContext,
} from "../../src/core/index.js";
import { IAuthorizationRequirement } from "../../src/core/types.js";

class DummyRequirement implements IAuthorizationRequirement {
  toString() {
    return "DummyRequirement";
  }
}

describe("DefaultAuthorizationHandlerContextFactory", () => {
  it("should implement IAuthorizationHandlerContextFactory", () => {
    const factory: IAuthorizationHandlerContextFactory =
      new DefaultAuthorizationHandlerContextFactory();
    expect(factory).toBeInstanceOf(DefaultAuthorizationHandlerContextFactory);
    expect(factory.createContext).toBeTypeOf("function");
  });

  it("should create an AuthorizationHandlerContext with requirements, user, and resource", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const reqs = [new DummyRequirement()];
    const user = { name: "alice" };
    const resource = { id: 123 };

    const ctx = factory.createContext(reqs, user, resource);

    expect(ctx).toBeInstanceOf(AuthorizationHandlerContext);
    expect(ctx.requirements).toEqual(reqs);
    expect(ctx.user).toEqual(user);
    expect(ctx.resource).toEqual(resource);
  });

  it("should handle empty requirements gracefully", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const ctx = factory.createContext([], { name: "bob" }, null);

    expect(ctx.requirements).toEqual([]);
    expect(ctx.user).toEqual({ name: "bob" });
    expect(ctx.resource).toBeNull();
    expect(ctx.pendingRequirements).toEqual([]);
  });

  it("should allow multiple requirements", () => {
    const factory = new DefaultAuthorizationHandlerContextFactory();
    const reqs = [new DummyRequirement(), new DummyRequirement()];
    const ctx = factory.createContext(reqs, { name: "carol" }, "resourceX");

    expect(ctx.requirements.length).toBe(2);
    expect(ctx.pendingRequirements.length).toBe(2);
  });
});
