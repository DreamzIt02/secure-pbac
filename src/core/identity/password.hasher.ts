// src/core/default-password-hasher.ts
import { promisify, randomBytes } from "./utils.js";

const scryptAsync = promisify();

/**
 * Interface for password hashing.
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

/**
 * Default implementation of IPasswordHasher.
 * Uses Node.js crypto.scrypt with a random salt.
 */
export class DefaultPasswordHasher implements IPasswordHasher {
  /**
   * Hashes the given password with a random salt.
   * @param password The plain text password.
   * @returns A salted hash string.
   */
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  /**
   * Verifies a password against a stored salted hash.
   * @param hash The stored salted hash string.
   * @param password The plain text password to verify.
   * @returns True if the password matches, false otherwise.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    const [salt, key] = hash.split(":");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return key === derivedKey.toString("hex");
  }
}
