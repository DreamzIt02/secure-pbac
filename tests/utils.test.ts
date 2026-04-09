import { describe, it, expect } from "vitest";
import { isEmpty, randomUUID, randomBytes, promisify, generateBase32 } from "../src/utils.js";

describe("Utility functions", () => {
  describe("isEmpty", () => {
    it("returns true for empty array", () => {
      expect(isEmpty([])).toBe(true);
    });

    it("returns false for non-empty array", () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it("returns true for empty Set", () => {
      expect(isEmpty(new Set())).toBe(true);
    });

    it("returns false for non-empty Set", () => {
      expect(isEmpty(new Set([1]))).toBe(false);
    });
  });

  describe("randomUUID", () => {
    it("generates a valid UUID string", () => {
      const uuid = randomUUID();
      // Basic UUID v4 regex
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("generates unique values", () => {
      const uuid1 = randomUUID();
      const uuid2 = randomUUID();
      expect(uuid1).not.toEqual(uuid2);
    });
  });

  describe("randomBytes", () => {
    it("returns a Buffer of requested length", () => {
      const buf = randomBytes(8);
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBe(8);
    });

    it("generates different values on subsequent calls", () => {
      const buf1 = randomBytes(8);
      const buf2 = randomBytes(8);
      expect(buf1.equals(buf2)).toBe(false);
    });
  });

  describe("promisify", () => {
    it("returns a function", () => {
      const fn = promisify();
      expect(typeof fn).toBe("function");
    });

    it("promisified scrypt works", async () => {
      const fn = promisify();
      const key = await fn("password", "salt", 64);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(64);
    });
  });

  describe("generateBase32", () => {
    it("returns a string", () => {
      const stamp = generateBase32();
      expect(typeof stamp).toBe("string");
    });

    it("returns different values on subsequent calls", () => {
      const s1 = generateBase32();
      const s2 = generateBase32();
      expect(s1).not.toEqual(s2);
    });

    it("produces base64url-safe characters", () => {
      const stamp = generateBase32();
      // base64url uses A-Z, a-z, 0-9, -, _
      expect(stamp).toMatch(/^[A-Za-z0-9\-_]+$/);
    });
  });
});
