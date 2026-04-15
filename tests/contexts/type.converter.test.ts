import { describe, it, expect } from "vitest";
import { TypeConverter } from "../../src/contexts/index.js";

describe("TypeConverter", () => {
  // ───────────────────────────────────────────────
  // Built-in conversions
  // ───────────────────────────────────────────────
  it("converts string to number", () => {
    expect(TypeConverter.convert("42", "number")).toBe(42);
  });

  it("converts string to bigint", () => {
    expect(TypeConverter.convert("42", "bigint")).toBe(42n);
  });

  it("converts string to boolean (true/false)", () => {
    expect(TypeConverter.convert("true", "boolean")).toBe(true);
    expect(TypeConverter.convert("false", "boolean")).toBe(false);
    expect(TypeConverter.convert("1", "boolean")).toBe(true);
    expect(TypeConverter.convert("0", "boolean")).toBe(false);
  });

  it("converts string to Date", () => {
    const d = TypeConverter.convert("2024-01-01", "Date");
    expect(d).toBeInstanceOf(Date);
    expect((d as Date).getUTCFullYear()).toBe(2024);
  });

  it("converts string to symbol", () => {
    const s = TypeConverter.convert("mySym", "symbol");
    expect(typeof s).toBe("symbol");
    expect((s as symbol).description).toBe("mySym");
  });

  it("converts string to null/undefined", () => {
    expect(TypeConverter.convert("null", "null")).toBeNull();
    expect(TypeConverter.convert("", "null")).toBeNull();
    expect(TypeConverter.convert("undefined", "undefined")).toBeUndefined();
    expect(TypeConverter.convert("", "undefined")).toBeUndefined();
  });

  // ───────────────────────────────────────────────
  // toString conversions
  // ───────────────────────────────────────────────
  it("converts values back to string", () => {
    expect(TypeConverter.toString(42n)).toBe("42");
    expect(TypeConverter.toString(new Date("2024-01-01"))).toMatch(/^2024-01-01/);
    expect(TypeConverter.toString(Symbol.for("x"))).toBe("x");
    expect(TypeConverter.toString(true)).toBe("true");
    expect(TypeConverter.toString(null)).toBe("null");
    expect(TypeConverter.toString(undefined)).toBe("undefined");
  });

  // ───────────────────────────────────────────────
  // Detection
  // ───────────────────────────────────────────────
  it("detects type names correctly", () => {
    expect(TypeConverter.detectTypeName("abc")).toBe("string");
    expect(TypeConverter.detectTypeName(123)).toBe("number");
    expect(TypeConverter.detectTypeName(123n)).toBe("bigint");
    expect(TypeConverter.detectTypeName(true)).toBe("boolean");
    expect(TypeConverter.detectTypeName(Symbol.for("y"))).toBe("symbol");
    expect(TypeConverter.detectTypeName(new Date())).toBe("Date");
    expect(TypeConverter.detectTypeName(null)).toBe("null");
    expect(TypeConverter.detectTypeName(undefined)).toBe("undefined");
  });

  // ───────────────────────────────────────────────
  // Error cases
  // ───────────────────────────────────────────────
  it("throws on invalid number conversion", () => {
    expect(() => TypeConverter.convert("abc", "number")).toThrow(TypeError);
  });

  it("throws on invalid bigint conversion", () => {
    expect(() => TypeConverter.convert("abc", "bigint")).toThrow(TypeError);
  });

  it("throws on invalid boolean conversion", () => {
    expect(() => TypeConverter.convert("maybe", "boolean")).toThrow(TypeError);
  });

  it("throws on invalid Date conversion", () => {
    expect(() => TypeConverter.convert("not-a-date", "Date")).toThrow(TypeError);
  });

  // ───────────────────────────────────────────────
  // Custom registration
  // ───────────────────────────────────────────────
  it("registers and uses a custom converter", () => {
    TypeConverter.register("URL", {
      detect: (v): v is URL => v instanceof URL,
      convert: (id: string) => new URL(id),
      toString: (v: URL) => v.href,
    });
    const url = TypeConverter.convert<URL>("https://example.com", "URL" as any) as URL;
    expect(url).toBeInstanceOf(URL);
    expect(TypeConverter.toString(url)).toBe("https://example.com/");
  });

  it("prevents overriding built-in converter", () => {
    expect(() =>
      TypeConverter.register("string", {
        detect: (v): v is string => typeof v === "string",
        convert: (id: string) => id,
        toString: (v: string) => v,
      })
    ).toThrow();
  });

  it("unknown typeName fallback to detection from sample", () => {
    const output = TypeConverter.convert("abc", "NotRegistered" as any)
    expect(output).toBeTypeOf("string");
    expect(output).toBe("abc");
  });
});
