import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationHandlerContext, DefaultAuthorizationHandlerProvider } from "../../src/core/index.js";
import { Exceptions } from "../../src/types/exception.js";

// Mock handler implementing IAuthorizationHandler
class MockHandler {
  async handleAsync(context: any) {
    return Promise.resolve();
  }
}

describe("DefaultAuthorizationHandlerProvider", () => {
  const user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]));
  const context = new AuthorizationHandlerContext([], user, null);

  it("constructs with valid handlers", async () => {
    const handler = new MockHandler();
    const provider = new DefaultAuthorizationHandlerProvider([handler]);
    const handlers = await provider.getHandlersAsync(context);
    expect([...handlers]).toEqual([handler]);
  });

  it("throws ArgumentNullException if handlers is null", () => {
    expect(() => new DefaultAuthorizationHandlerProvider(null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("getHandlersAsync returns same handlers regardless of context", async () => {
    const handler1 = new MockHandler();
    const handler2 = new MockHandler();
    const provider = new DefaultAuthorizationHandlerProvider([handler1, handler2]);
    const handlers = await provider.getHandlersAsync(context);
    expect([...handlers]).toContain(handler1);
    expect([...handlers]).toContain(handler2);
  });

  it("getHandlersAsync resolves to iterable", async () => {
    const handler = new MockHandler();
    const provider = new DefaultAuthorizationHandlerProvider([handler]);
    const result = await provider.getHandlersAsync(context);
    expect(Symbol.iterator in result).toBe(true);
  });
});
