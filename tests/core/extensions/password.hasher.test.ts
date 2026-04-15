import { describe, it, expect } from "vitest";
import { IdentityUser, PasswordVerificationResult } from "../../../src/core/types/index.js";
import { PasswordHasher, PasswordHasherCompatibilityMode, PasswordHasherOptions } from "../../../src/core/extensions/index.js";

class TestUser extends IdentityUser<string> {
  id = "1";
  userName = "test";
  email = "test@example.com";
  emailConfirmed = true;
  passwordHash = "";
  securityStamp = "";
  concurrencyStamp = "";
  phoneNumber = "";
  phoneNumberConfirmed = false;
  twoFactorEnabled = false;
  lockoutEnd = null;
  lockoutEnabled = false;
  accessFailedCount = 0;
}

describe("PasswordHasher", () => {
  const user = new TestUser();

  it("constructs with default options (IdentityV3)", () => {
    const hasher = new PasswordHasher();
    expect(hasher).toBeInstanceOf(PasswordHasher);
  });

  it("constructs with IdentityV2 mode", () => {
    const options = new PasswordHasherOptions();
    options.compatibilityMode = PasswordHasherCompatibilityMode.IdentityV2;
    const hasher = new PasswordHasher(options);
    const hash = hasher.hashPassword(user, "password");
    expect(typeof hash).toBe("string");
    const result = hasher.verifyHashedPassword(user, hash, "password");
    expect(result).toBe(PasswordVerificationResult.Success);
  });

  it("constructs with IdentityV3 mode and custom iteration count", () => {
    const options = new PasswordHasherOptions();
    options.compatibilityMode = PasswordHasherCompatibilityMode.IdentityV3;
    options.iterationCount = 20000;
    const hasher = new PasswordHasher(options);
    const hash = hasher.hashPassword(user, "password");
    expect(typeof hash).toBe("string");
    const result = hasher.verifyHashedPassword(user, hash, "password");
    expect([PasswordVerificationResult.Success, PasswordVerificationResult.SuccessRehashNeeded]).toContain(result);
  });

  it("throws error for invalid iteration count in V3", () => {
    const options = new PasswordHasherOptions();
    options.compatibilityMode = PasswordHasherCompatibilityMode.IdentityV3;
    options.iterationCount = 0;
    expect(() => new PasswordHasher(options)).toThrow("Invalid password hasher iteration count.");
  });

  it("throws error for invalid compatibility mode", () => {
    const options = new PasswordHasherOptions() as any;
    options.compatibilityMode = 999;
    expect(() => new PasswordHasher(options)).toThrow("Invalid password hasher compatibility mode.");
  });

  it("hashes and verifies password in V3 mode", () => {
    const hasher = new PasswordHasher();
    const hash = hasher.hashPassword(user, "secret");
    const result = hasher.verifyHashedPassword(user, hash, "secret");
    expect([PasswordVerificationResult.Success, PasswordVerificationResult.SuccessRehashNeeded]).toContain(result);
  });

  it("fails verification with wrong password", () => {
    const hasher = new PasswordHasher();
    const hash = hasher.hashPassword(user, "secret");
    const result = hasher.verifyHashedPassword(user, hash, "wrong");
    expect(result).toBe(PasswordVerificationResult.Failed);
  });

  it("fails verification with invalid hash", () => {
    const hasher = new PasswordHasher();
    const result = hasher.verifyHashedPassword(user, "invalidbase64", "password");
    expect(result).toBe(PasswordVerificationResult.Failed);
  });

  it("verifyHashedPassword returns Failed for unknown format marker", () => {
    const hasher = new PasswordHasher();
    const badHash = Buffer.from([0x99]).toString("base64");
    const result = hasher.verifyHashedPassword(user, badHash, "password");
    expect(result).toBe(PasswordVerificationResult.Failed);
  });

  it("verifyHashedPasswordV2 fails with invalid length", () => {
    const hasher = new PasswordHasher(new PasswordHasherOptions());
    const buf = Buffer.alloc(10);
    const result = (hasher as any).verifyHashedPasswordV2(buf, "password");
    expect(result).toBe(PasswordVerificationResult.Failed);
  });

  it("verifyHashedPasswordV3 returns Failed on error", () => {
    const hasher = new PasswordHasher();
    const buf = Buffer.from([0x01]); // too short
    const result = (hasher as any).verifyHashedPasswordV3(buf, "password");
    expect(result).toBe(PasswordVerificationResult.Failed);
  });
});
