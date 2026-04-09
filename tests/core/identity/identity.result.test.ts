// tests/core/identity/identity.result.test.ts
import { describe, it, expect } from "vitest";
import { IdentityResult, IdentityError } from "../../../src/core/identity/index.js";

describe("IdentityResult", () => {
  it("should create a success result", () => {
    const result = IdentityResult.success();
    expect(result.succeeded).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.toString()).toBe("Succeeded");
  });

  it("should create a failed result with errors", () => {
    const error = new IdentityError("DuplicateUserName", "User name already exists");
    const result = IdentityResult.failed([error]);
    expect(result.succeeded).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("DuplicateUserName");
    expect(result.errors[0].description).toBe("User name already exists");
    expect(result.toString()).toBe("Failed : DuplicateUserName");
  });

  it("should create a failed result with multiple errors", () => {
    const error1 = new IdentityError("InvalidEmail", "Email is invalid");
    const error2 = new IdentityError("PasswordTooShort", "Password must be longer");
    const result = IdentityResult.failed([error1, error2]);
    expect(result.succeeded).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.toString()).toBe("Failed : InvalidEmail,PasswordTooShort");
  });

  it("should handle failed result with empty errors array", () => {
    const result = IdentityResult.failed([]);
    expect(result.succeeded).toBe(false);
    expect(result.errors).toHaveLength(0);
    expect(result.toString()).toBe("Failed : ");
  });

  it("should allow constructing directly with succeeded flag", () => {
    const result = new IdentityResult(true);
    expect(result.succeeded).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should allow constructing directly with errors", () => {
    const error = new IdentityError("CustomError", "Something went wrong");
    const result = new IdentityResult(false, [error]);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("CustomError");
    expect(result.errors[0].description).toBe("Something went wrong");
  });
});
