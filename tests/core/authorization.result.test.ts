import { describe, it, expect } from "vitest";
import { AuthorizationFailure, AuthorizationFailureReason, AuthorizationResult } from "../../src/core/index.js";

// Simple mock handler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("AuthorizationResult", () => {
  it("success returns singleton with succeeded true", () => {
    const result = AuthorizationResult.success();
    expect(result.succeeded).toBe(true);
    expect(result.failure).toBeUndefined();
  });

  it("failed returns new result with succeeded false and failure set", () => {
    const handler = new MockHandler();
    const reason = new AuthorizationFailureReason(handler, "Access denied");
    const failure = AuthorizationFailure.failed([reason]);
    const result = AuthorizationResult.failed(failure);
    expect(result.succeeded).toBe(false);
    expect(result.failure).toBe(failure);
    expect(result.failure?.failureReasons[0].message).toBe("Access denied");
  });

  it("failedDefault returns singleton with succeeded false and explicit failure", () => {
    const result = AuthorizationResult.failedDefault();
    expect(result.succeeded).toBe(false);
    expect(result.failure).toBeDefined();
    expect(result.failure?.failCalled).toBe(true);
  });

  it("success and failedDefault return consistent singleton instances", () => {
    const s1 = AuthorizationResult.success();
    const s2 = AuthorizationResult.success();
    expect(s1).toBe(s2);

    const f1 = AuthorizationResult.failedDefault();
    const f2 = AuthorizationResult.failedDefault();
    expect(f1).toBe(f2);
  });
});
