import { describe, it, expect } from "vitest";
import { PolicyAuthorizationResult } from "../../src/policy/index.js";
import { AuthorizationFailure, AuthorizationFailureReason } from "../../src/core/index.js";


// Mock requirement
class MockRequirement {}
// Mock handler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("PolicyAuthorizationResult", () => {
  it("challenge returns challenged result", () => {
    const result = PolicyAuthorizationResult.challenge();
    expect(result.challenged).toBe(true);
    expect(result.forbidden).toBe(false);
    expect(result.succeeded).toBe(false);
    expect(result.authorizationFailure).toBeUndefined();
  });

  it("forbid returns forbidden result without failure", () => {
    const result = PolicyAuthorizationResult.forbid();
    expect(result.forbidden).toBe(true);
    expect(result.challenged).toBe(false);
    expect(result.succeeded).toBe(false);
    expect(result.authorizationFailure).toBeUndefined();
  });

  it("forbid returns forbidden result with AuthorizationFailure", () => {
    const failure = AuthorizationFailure.failed([new MockRequirement()]);
    const result = PolicyAuthorizationResult.forbid(failure);
    expect(result.forbidden).toBe(true);
    expect(result.authorizationFailure).toBe(failure);
    expect(result.authorizationFailure?.failedRequirements[0]).toBeInstanceOf(MockRequirement);
  });

  it("forbid returns forbidden result with AuthorizationFailureReason", () => {
    const reason = new AuthorizationFailureReason(new MockHandler(), "Missing role");
    const failure = AuthorizationFailure.failed([reason]);
    const result = PolicyAuthorizationResult.forbid(failure);
    expect(result.forbidden).toBe(true);
    expect(result.authorizationFailure?.failureReasons[0].message).toBe("Missing role");
    expect(result.authorizationFailure?.failureReasons[0].toString())
      .toContain("AuthorizationFailureReason");
  });

  it("success returns succeeded result", () => {
    const result = PolicyAuthorizationResult.success();
    expect(result.succeeded).toBe(true);
    expect(result.challenged).toBe(false);
    expect(result.forbidden).toBe(false);
    expect(result.authorizationFailure).toBeUndefined();
  });

  it("allows overriding properties manually", () => {
    const failure = AuthorizationFailure.explicitFail();
    const result = PolicyAuthorizationResult.forbid(failure);
    result.challenged = true;
    result.succeeded = true;
    expect(result.challenged).toBe(true);
    expect(result.succeeded).toBe(true);
    expect(result.authorizationFailure?.failCalled).toBe(true);
  });
});
