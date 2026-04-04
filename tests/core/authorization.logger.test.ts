// tests/core/authorization.logger.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DefaultAuthorizationLogger, IAuthorizationLogger } from "../../src/core/index.js";

describe("DefaultAuthorizationLogger", () => {
  let logger: IAuthorizationLogger;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new DefaultAuthorizationLogger();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should implement IAuthorizationLogger interface", () => {
    expect(logger.userAuthorizationSucceeded).toBeTypeOf("function");
    expect(logger.userAuthorizationFailed).toBeTypeOf("function");
  });

  it("should log success message when authorization succeeds", () => {
    logger.userAuthorizationSucceeded();
    expect(logSpy).toHaveBeenCalledWith("Authorization succeeded.");
  });

  it("should log failure message with details when authorization fails", () => {
    const failure = { reason: "Invalid role" };
    logger.userAuthorizationFailed(failure);
    expect(errorSpy).toHaveBeenCalledWith("Authorization failed.", failure);
  });

  it("should handle failure with null details gracefully", () => {
    logger.userAuthorizationFailed(null);
    expect(errorSpy).toHaveBeenCalledWith("Authorization failed.", null);
  });

  it("should handle failure with string details", () => {
    logger.userAuthorizationFailed("Access denied");
    expect(errorSpy).toHaveBeenCalledWith("Authorization failed.", "Access denied");
  });
});
