import { describe, it, expect } from "vitest";
import { UserOptions } from "../../../src/core/options/index.js";

describe("UserOptions", () => {
  it("has correct default values", () => {
    const options = new UserOptions();
    expect(options.allowedUserNameCharacters).toBe(
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+"
    );
    expect(options.requireUniqueEmail).toBe(false);
  });

  it("allows overriding allowedUserNameCharacters", () => {
    const options = new UserOptions();
    options.allowedUserNameCharacters = "abc123";
    expect(options.allowedUserNameCharacters).toBe("abc123");
  });

  it("allows overriding requireUniqueEmail", () => {
    const options = new UserOptions();
    options.requireUniqueEmail = true;
    expect(options.requireUniqueEmail).toBe(true);
  });

  it("supports toggling requireUniqueEmail back to false", () => {
    const options = new UserOptions();
    options.requireUniqueEmail = true;
    expect(options.requireUniqueEmail).toBe(true);
    options.requireUniqueEmail = false;
    expect(options.requireUniqueEmail).toBe(false);
  });
});
