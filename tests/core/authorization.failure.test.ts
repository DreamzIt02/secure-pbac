import { describe, it, expect } from "vitest";
import { IAuthorizationRequirement } from "../../src/core/types/index.js";
import { AuthorizationFailure, AuthorizationFailureReason } from "../../src/core/index.js";

// Simple mock requirement
class MockRequirement implements IAuthorizationRequirement {}

// Simple mock handler
class MockHandler {
  async handleAsync() {
    return Promise.resolve();
  }
}

describe("AuthorizationFailure", () => {
  it("explicitFail returns singleton with failCalled true", () => {
    const fail = AuthorizationFailure.explicitFail();
    expect(fail.failCalled).toBe(true);
    expect(fail.failedRequirements).toEqual([]);
    expect(fail.failureReasons).toEqual([]);
  });

  it("failed with reasons sets failCalled true and failureReasons", () => {
    const handler = new MockHandler();
    const reason = new AuthorizationFailureReason(handler, "Access denied");
    const fail = AuthorizationFailure.failed([reason]);
    expect(fail.failCalled).toBe(true);
    expect(fail.failureReasons.length).toBe(1);
    expect(fail.failureReasons[0].message).toBe("Access denied");
    expect(fail.failedRequirements).toEqual([]);
  });

  it("failed with requirements sets failCalled false and failedRequirements", () => {
    const req1 = new MockRequirement();
    const req2 = new MockRequirement();
    const fail = AuthorizationFailure.failed([req1, req2]);
    expect(fail.failCalled).toBe(false);
    expect(fail.failedRequirements.length).toBe(2);
    expect(fail.failureReasons).toEqual([]);
  });

  it("failed with empty reasons returns failCalled true and empty failureReasons", () => {
    const fail = AuthorizationFailure.failed([] as AuthorizationFailureReason[]);
    expect(fail.failCalled).toBe(false); // because branch falls to requirements
    expect(fail.failureReasons).toEqual([]);
    expect(fail.failedRequirements).toEqual([]);
  });

  it("failed with empty requirements returns failCalled false and empty failedRequirements", () => {
    const fail = AuthorizationFailure.failed([] as IAuthorizationRequirement[]);
    expect(fail.failCalled).toBe(false);
    expect(fail.failedRequirements).toEqual([]);
    expect(fail.failureReasons).toEqual([]);
  });
});
