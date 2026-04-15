import { describe, it, expect } from "vitest";
import { LockoutOptions } from "../../../src/core/options/index.js";

describe("LockoutOptions", () => {
  it("has correct default values", () => {
    const options = new LockoutOptions();
    expect(options.allowedForNewUsers).toBe(true);
    expect(options.maxFailedAccessAttempts).toBe(5);
    expect(options.defaultLockoutTimeSpan).toBe(5 * 60 * 1000); // 5 minutes in ms
  });

  it("allows overriding allowedForNewUsers", () => {
    const options = new LockoutOptions();
    options.allowedForNewUsers = false;
    expect(options.allowedForNewUsers).toBe(false);
  });

  it("allows overriding maxFailedAccessAttempts", () => {
    const options = new LockoutOptions();
    options.maxFailedAccessAttempts = 10;
    expect(options.maxFailedAccessAttempts).toBe(10);
  });

  it("allows overriding defaultLockoutTimeSpan", () => {
    const options = new LockoutOptions();
    options.defaultLockoutTimeSpan = 10 * 60 * 1000; // 10 minutes
    expect(options.defaultLockoutTimeSpan).toBe(10 * 60 * 1000);
  });

  it("supports toggling allowedForNewUsers back to true", () => {
    const options = new LockoutOptions();
    options.allowedForNewUsers = false;
    expect(options.allowedForNewUsers).toBe(false);
    options.allowedForNewUsers = true;
    expect(options.allowedForNewUsers).toBe(true);
  });
});
