import { describe, it, expect } from "vitest";
import { PasswordOptions } from "../../../src/core/options/index.js";

describe("PasswordOptions", () => {
  it("has correct default values", () => {
    const options = new PasswordOptions();
    expect(options.requiredLength).toBe(6);
    expect(options.requiredUniqueChars).toBe(1);
    expect(options.requireNonAlphanumeric).toBe(true);
    expect(options.requireLowercase).toBe(true);
    expect(options.requireUppercase).toBe(true);
    expect(options.requireDigit).toBe(true);
  });

  it("allows overriding requiredLength", () => {
    const options = new PasswordOptions();
    options.requiredLength = 10;
    expect(options.requiredLength).toBe(10);
  });

  it("allows overriding requiredUniqueChars", () => {
    const options = new PasswordOptions();
    options.requiredUniqueChars = 3;
    expect(options.requiredUniqueChars).toBe(3);
  });

  it("allows overriding requireNonAlphanumeric", () => {
    const options = new PasswordOptions();
    options.requireNonAlphanumeric = false;
    expect(options.requireNonAlphanumeric).toBe(false);
  });

  it("allows overriding requireLowercase", () => {
    const options = new PasswordOptions();
    options.requireLowercase = false;
    expect(options.requireLowercase).toBe(false);
  });

  it("allows overriding requireUppercase", () => {
    const options = new PasswordOptions();
    options.requireUppercase = false;
    expect(options.requireUppercase).toBe(false);
  });

  it("allows overriding requireDigit", () => {
    const options = new PasswordOptions();
    options.requireDigit = false;
    expect(options.requireDigit).toBe(false);
  });

  it("supports toggling flags back to true", () => {
    const options = new PasswordOptions();
    options.requireNonAlphanumeric = false;
    options.requireLowercase = false;
    options.requireUppercase = false;
    options.requireDigit = false;

    expect(options.requireNonAlphanumeric).toBe(false);
    expect(options.requireLowercase).toBe(false);
    expect(options.requireUppercase).toBe(false);
    expect(options.requireDigit).toBe(false);

    options.requireNonAlphanumeric = true;
    options.requireLowercase = true;
    options.requireUppercase = true;
    options.requireDigit = true;

    expect(options.requireNonAlphanumeric).toBe(true);
    expect(options.requireLowercase).toBe(true);
    expect(options.requireUppercase).toBe(true);
    expect(options.requireDigit).toBe(true);
  });
});
