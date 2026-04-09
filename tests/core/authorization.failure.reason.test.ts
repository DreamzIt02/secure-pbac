import { describe, it, expect } from "vitest";
import { AuthorizationFailureReason } from "../../src/core/index.js";
import { Exceptions } from "../../src/types/exception.js";

// Simple mock handler implementing IAuthorizationHandler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("AuthorizationFailureReason", () => {
  it("constructs with valid handler and message", () => {
    const handler = new MockHandler();
    const reason = new AuthorizationFailureReason(handler, "Access denied");
    expect(reason.handler).toBe(handler);
    expect(reason.message).toBe("Access denied");
  });

  it("throws ArgumentNullException if handler is null", () => {
    expect(() => new AuthorizationFailureReason(null as any, "msg"))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throws ArgumentNullOrEmptyException if message is null", () => {
    const handler = new MockHandler();
    expect(() => new AuthorizationFailureReason(handler, null as any))
      .toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("throws ArgumentNullOrEmptyException if message is empty string", () => {
    const handler = new MockHandler();
    expect(() => new AuthorizationFailureReason(handler, ""))
      .toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("toString returns formatted string", () => {
    const handler = new MockHandler();
    const reason = new AuthorizationFailureReason(handler, "Forbidden");
    const str = reason.toString();
    expect(str).toContain("AuthorizationFailureReason");
    expect(str).toContain("MockHandler");
    expect(str).toContain("Forbidden");
  });
});
