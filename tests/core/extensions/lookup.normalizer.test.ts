import { describe, it, expect } from "vitest";
import { LookupNormalizer } from "../../../src/core/extensions/index.js";

describe("LookupNormalizer", () => {
  const normalizer = new LookupNormalizer();

  describe("normalizeName", () => {
    it("returns null when name is null", () => {
      expect(normalizer.normalizeName(null)).toBeNull();
    });

    it("converts lowercase name to uppercase", () => {
      expect(normalizer.normalizeName("alice")).toBe("ALICE");
    });

    it("converts mixed case name to uppercase", () => {
      expect(normalizer.normalizeName("aLiCe")).toBe("ALICE");
    });

    it("leaves uppercase name unchanged", () => {
      expect(normalizer.normalizeName("ALICE")).toBe("ALICE");
    });
  });

  describe("normalizeEmail", () => {
    it("returns null when email is null", () => {
      expect(normalizer.normalizeEmail(null)).toBeNull();
    });

    it("converts lowercase email to uppercase", () => {
      expect(normalizer.normalizeEmail("alice@example.com")).toBe("ALICE@EXAMPLE.COM");
    });

    it("converts mixed case email to uppercase", () => {
      expect(normalizer.normalizeEmail("Alice@Example.Com")).toBe("ALICE@EXAMPLE.COM");
    });

    it("leaves uppercase email unchanged", () => {
      expect(normalizer.normalizeEmail("ALICE@EXAMPLE.COM")).toBe("ALICE@EXAMPLE.COM");
    });
  });
});
