import { describe, it, expect } from "vitest";
import { SignInOptions } from "../../../src/core/options/index.js";

describe("SignInOptions", () => {
  it("has correct default values", () => {
    const options = new SignInOptions();
    expect(options.requireConfirmedEmail).toBe(false);
    expect(options.requireConfirmedPhoneNumber).toBe(false);
    expect(options.requireConfirmedAccount).toBe(false);
  });

  it("allows overriding requireConfirmedEmail", () => {
    const options = new SignInOptions();
    options.requireConfirmedEmail = true;
    expect(options.requireConfirmedEmail).toBe(true);
  });

  it("allows overriding requireConfirmedPhoneNumber", () => {
    const options = new SignInOptions();
    options.requireConfirmedPhoneNumber = true;
    expect(options.requireConfirmedPhoneNumber).toBe(true);
  });

  it("allows overriding requireConfirmedAccount", () => {
    const options = new SignInOptions();
    options.requireConfirmedAccount = true;
    expect(options.requireConfirmedAccount).toBe(true);
  });

  it("supports toggling flags back to false", () => {
    const options = new SignInOptions();
    options.requireConfirmedEmail = true;
    options.requireConfirmedPhoneNumber = true;
    options.requireConfirmedAccount = true;

    expect(options.requireConfirmedEmail).toBe(true);
    expect(options.requireConfirmedPhoneNumber).toBe(true);
    expect(options.requireConfirmedAccount).toBe(true);

    options.requireConfirmedEmail = false;
    options.requireConfirmedPhoneNumber = false;
    options.requireConfirmedAccount = false;

    expect(options.requireConfirmedEmail).toBe(false);
    expect(options.requireConfirmedPhoneNumber).toBe(false);
    expect(options.requireConfirmedAccount).toBe(false);
  });
});
