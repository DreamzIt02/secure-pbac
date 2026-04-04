// tests/default-password-hasher.test.ts
import { describe, it, expect } from "vitest";
import { DefaultPasswordHasher } from "../../../src/core/identity/index.js";

describe("DefaultPasswordHasher", () => {
  const hasher = new DefaultPasswordHasher();

  it("should hash a password and return a string with salt and hash", async () => {
    const hash = await hasher.hash("password123");
    expect(hash).toContain(":");
    const [salt, key] = hash.split(":");
    expect(salt).toBeTruthy();
    expect(key).toBeTruthy();
  });

  it("should verify a correct password", async () => {
    const hash = await hasher.hash("secret");
    const result = await hasher.verify(hash, "secret");
    expect(result).toBe(true);
  });

  it("should fail verification for incorrect password", async () => {
    const hash = await hasher.hash("secret");
    const result = await hasher.verify(hash, "wrongpassword");
    expect(result).toBe(false);
  });

  it("should generate different hashes for the same password due to random salt", async () => {
    const hash1 = await hasher.hash("repeat");
    const hash2 = await hasher.hash("repeat");
    expect(hash1).not.toEqual(hash2);
  });

  it("should handle malformed hash string gracefully", async () => {
    const result = await hasher.verify("invalidhashstring", "password");
    expect(result).toBe(false);
  });
});
