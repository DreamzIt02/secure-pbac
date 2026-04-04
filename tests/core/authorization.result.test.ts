import { AuthorizationResult, AuthorizationFailure, AuthorizationFailureReason } from "../../src/core/index.js";
import { IAuthorizationRequirement, IAuthorizationHandler } from "../../src/core/types.js";

describe("AuthorizationResult", () => {
  it("should return a successful result", () => {
    const result = AuthorizationResult.success();
    expect(result.succeeded).toBe(true);
    expect(result.failure).toBeUndefined();
  });

  it("should return a failed result with explicit failure", () => {
    const result = AuthorizationResult.failedDefault();
    expect(result.succeeded).toBe(false);
    expect(result.failure).toBeInstanceOf(AuthorizationFailure);
    expect(result.failure?.failCalled).toBe(true);
  });

  it("should return a failed result with custom failure", () => {
    const failure = AuthorizationFailure.failedRequirements([{ toString: () => "req" }]);
    const result = AuthorizationResult.failed(failure);
    expect(result.succeeded).toBe(false);
    expect(result.failure).toBe(failure);
    expect(result.failure?.failedRequirements.length).toBe(1);
  });
});

describe("AuthorizationFailure", () => {
  it("should create explicit failure", () => {
    const failure = AuthorizationFailure.explicitFail();
    expect(failure.failCalled).toBe(true);
    expect(failure.failedRequirements).toEqual([]);
    expect(failure.failureReasons).toEqual([]);
  });

  it("should create failure with reasons", () => {
    const handler: IAuthorizationHandler = {
      handleAsync: async () => {}
    };
    const reason = new AuthorizationFailureReason(handler, "Denied");
    const failure = AuthorizationFailure.failedWithReasons([reason]);
    expect(failure.failCalled).toBe(true);
    expect(failure.failureReasons[0].message).toBe("Denied");
  });

  it("should create failure with failed requirements", () => {
    const requirement: IAuthorizationRequirement = { toString: () => "req" };
    const failure = AuthorizationFailure.failedRequirements([requirement]);
    expect(failure.failCalled).toBe(false);
    expect(failure.failedRequirements[0].toString()).toBe("req");
  });
});

describe("AuthorizationFailureReason", () => {
  it("should store handler and message", () => {
    const handler: IAuthorizationHandler = {
      handleAsync: async () => {}
    };
    const reason = new AuthorizationFailureReason(handler, "Test reason");
    expect(reason.handler).toBe(handler);
    expect(reason.message).toBe("Test reason");
  });
});
