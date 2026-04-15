import { describe, it, expect } from "vitest";
import {
  tryParseEnum,
  tryParseEnumOrThrow,
  tryParse,
  extractEnum,
} from "../../src/types/enums.js";

// Numeric enum
enum NumericEnum {
  A = 0,
  B = 1,
  C = 2,
}

// String enum
enum StringEnum {
  Admin = "Admin",
  User = "User",
  Guest = "Guest",
}

describe("tryParseEnum utilities", () => {
  it("parses numeric enum with number", () => {
    expect(tryParseEnum(NumericEnum, 1)).toBe(1);
    expect(tryParseEnum(NumericEnum, 99)).toBeNull();
  });

  it("parses numeric enum with string number", () => {
    expect(tryParseEnum(NumericEnum, "2")).toBe(2);
    expect(tryParseEnum(NumericEnum, " 1 ")).toBe(1);
  });

  it("parses string enum with string", () => {
    expect(tryParseEnum(StringEnum, "Admin")).toBe("Admin");
    expect(tryParseEnum(StringEnum, "User")).toBe("User");
    expect(tryParseEnum(StringEnum, "Invalid")).toBeNull();
  });

  it("rejects reverse mapping keys from numeric enum", () => {
    // Reverse mapping keys like "A" should not be accepted
    expect(tryParseEnum(NumericEnum, "A")).toBeNull();
  });

  it("returns null for null or undefined", () => {
    expect(tryParseEnum(NumericEnum, null)).toBeNull();
    expect(tryParseEnum(NumericEnum, undefined)).toBeNull();
  });

  it("tryParseEnumOrThrow returns value or throws", () => {
    expect(tryParseEnumOrThrow(NumericEnum, 0)).toBe(0);
    expect(() => tryParseEnumOrThrow(NumericEnum, "bad")).toThrowError(
      "Invalid enum value: bad"
    );
  });

  it("tryParse sets output and returns boolean", () => {
    const out: { value: any } = { value: null };
    const ok = tryParse(StringEnum, "Guest", out);
    expect(ok).toBe(true);
    expect(out.value).toBe("Guest");

    const bad = tryParse(StringEnum, "Nope", out);
    expect(bad).toBe(false);
    expect(out.value).toBeUndefined();
  });

  it("extractEnum returns object without numeric keys", () => {
    const obj = extractEnum(NumericEnum);
    expect(obj).toHaveProperty("A", 0);
    expect(obj).toHaveProperty("B", 1);
    expect(obj).toHaveProperty("C", 2);
    expect(Object.keys(obj)).toContain("A");
  });

  it("extractEnum with asArray returns values array", () => {
    const arr = extractEnum(StringEnum, true);
    expect(arr).toContain("Admin");
    expect(arr).toContain("User");
    expect(arr).toContain("Guest");
  });
});
