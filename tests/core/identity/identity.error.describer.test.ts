// tests/core/identity/identity.error.describer.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { IdentityErrorDescriber } from "../../../src/core/identity/index.js";

describe("IdentityErrorDescriber", () => {
  let describer: IdentityErrorDescriber;

  beforeEach(() => {
    describer = new IdentityErrorDescriber();
  });

  it("should return default error", () => {
    const error = describer.defaultError();
    expect(error.code).toBe("DefaultError");
    expect(error.description).toContain("failure");
  });

  it("should return concurrency failure", () => {
    const error = describer.concurrencyFailure();
    expect(error.code).toBe("ConcurrencyFailure");
    expect(error.description).toContain("concurrency");
  });

  it("should return password mismatch", () => {
    const error = describer.passwordMismatch();
    expect(error.code).toBe("PasswordMismatch");
    expect(error.description).toContain("Incorrect");
  });

  it("should return invalid token", () => {
    const error = describer.invalidToken();
    expect(error.code).toBe("InvalidToken");
    expect(error.description).toContain("Invalid");
  });

  it("should return recovery code redemption failed", () => {
    const error = describer.recoveryCodeRedemptionFailed();
    expect(error.code).toBe("RecoveryCodeRedemptionFailed");
    expect(error.description).toContain("Recovery");
  });

  it("should return login already associated", () => {
    const error = describer.loginAlreadyAssociated();
    expect(error.code).toBe("LoginAlreadyAssociated");
    expect(error.description).toContain("external login");
  });

  it("should return invalid user name", () => {
    const error = describer.invalidUserName("alice");
    expect(error.code).toBe("InvalidUserName");
    expect(error.description).toContain("alice");
  });

  it("should return invalid email", () => {
    const error = describer.invalidEmail("test@example.com");
    expect(error.code).toBe("InvalidEmail");
    expect(error.description).toContain("test@example.com");
  });

  it("should return duplicate user name", () => {
    const error = describer.duplicateUserName("bob");
    expect(error.code).toBe("DuplicateUserName");
    expect(error.description).toContain("bob");
  });

  it("should return duplicate email", () => {
    const error = describer.duplicateEmail("bob@example.com");
    expect(error.code).toBe("DuplicateEmail");
    expect(error.description).toContain("bob@example.com");
  });

  it("should return invalid role name", () => {
    const error = describer.invalidRoleName("Admin");
    expect(error.code).toBe("InvalidRoleName");
    expect(error.description).toContain("Admin");
  });

  it("should return duplicate role name", () => {
    const error = describer.duplicateRoleName("User");
    expect(error.code).toBe("DuplicateRoleName");
    expect(error.description).toContain("User");
  });

  it("should return user already has password", () => {
    const error = describer.userAlreadyHasPassword();
    expect(error.code).toBe("UserAlreadyHasPassword");
    expect(error.description).toContain("password");
  });

  it("should return user lockout not enabled", () => {
    const error = describer.userLockoutNotEnabled();
    expect(error.code).toBe("UserLockoutNotEnabled");
    expect(error.description).toContain("Lockout");
  });

  it("should return user already in role", () => {
    const error = describer.userAlreadyInRole("Admin");
    expect(error.code).toBe("UserAlreadyInRole");
    expect(error.description).toContain("Admin");
  });

  it("should return user not in role", () => {
    const error = describer.userNotInRole("User");
    expect(error.code).toBe("UserNotInRole");
    expect(error.description).toContain("User");
  });

  it("should return password too short", () => {
    const error = describer.passwordTooShort(5);
    expect(error.code).toBe("PasswordTooShort");
    expect(error.description).toContain("5");
  });

  it("should return password requires unique chars", () => {
    const error = describer.passwordRequiresUniqueChars(3);
    expect(error.code).toBe("PasswordRequiresUniqueChars");
    expect(error.description).toContain("3");
  });

  it("should return password requires non alphanumeric", () => {
    const error = describer.passwordRequiresNonAlphanumeric();
    expect(error.code).toBe("PasswordRequiresNonAlphanumeric");
    expect(error.description).toContain("non alphanumeric");
  });

  it("should return password requires digit", () => {
    const error = describer.passwordRequiresDigit();
    expect(error.code).toBe("PasswordRequiresDigit");
    expect(error.description).toContain("digit");
  });

  it("should return password requires lower", () => {
    const error = describer.passwordRequiresLower();
    expect(error.code).toBe("PasswordRequiresLower");
    expect(error.description).toContain("lowercase");
  });

  it("should return password requires upper", () => {
    const error = describer.passwordRequiresUpper();
    expect(error.code).toBe("PasswordRequiresUpper");
    expect(error.description).toContain("uppercase");
  });
});
