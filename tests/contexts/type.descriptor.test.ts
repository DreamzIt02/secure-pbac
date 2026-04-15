import { describe, it, expect } from "vitest";
import { CategoryAttribute, DefaultValueAttribute, DescriptionAttribute, DisplayNameAttribute, ReadOnlyAttribute, TypeDescriptor } from "../../src/contexts/index.js";


describe("TypeDescriptor", () => {
  // ───────────────────────────────────────────────
  // Conversion
  // ───────────────────────────────────────────────
  it("converts from string with explicit typeName", () => {
    expect(TypeDescriptor.convertFromString("42", "number")).toBe(42);
    expect(TypeDescriptor.convertFromString("true", "boolean")).toBe(true);
    expect(TypeDescriptor.convertFromString("2024-01-01", "Date")).toBeInstanceOf(Date);
    expect(TypeDescriptor.convertFromString(null, "number")).toBeNull();
  });

  it("converts from string with sample value", () => {
    expect(TypeDescriptor.convertFromString("42", 0)).toBe(42);
    expect(TypeDescriptor.convertFromString("true", false)).toBe(true);
    expect(TypeDescriptor.convertFromString("2024-01-01", new Date())).toBeInstanceOf(Date);
  });

  it("converts to string", () => {
    expect(TypeDescriptor.convertToString(42n)).toBe("42");
    expect(TypeDescriptor.convertToString(new Date("2024-01-01"))).toMatch(/^2024-01-01/);
    expect(TypeDescriptor.convertToString(null)).toBeNull();
    expect(TypeDescriptor.convertToString(undefined)).toBeNull();
  });

  // ───────────────────────────────────────────────
  // Converter resolution
  // ───────────────────────────────────────────────
  it("gets converter by typeName or sample", () => {
    expect(TypeDescriptor.getConverter("number")).toBe("number");
    expect(TypeDescriptor.getConverter(new Date())).toBe("Date");
  });

  // ───────────────────────────────────────────────
  // Property reflection
  // ───────────────────────────────────────────────
  it("reflects properties with descriptors", () => {
    const obj = { name: "Alice", age: 30 };
    TypeDescriptor.addAttributes("Object.age", new DescriptionAttribute("Age in years"));
    const col = TypeDescriptor.getProperties(obj);

    expect(col.count).toBe(2);
    const ageDesc = col.find("age");
    expect(ageDesc?.typeName).toBe("number");
    expect(ageDesc?.description).toBe("Age in years");

    // test setValue and getValue
    ageDesc?.setValue(obj, 40);
    expect(obj.age).toBe(40);

    // test resetValue with DefaultValueAttribute
    TypeDescriptor.addAttributes("Object.age", new DefaultValueAttribute(25));
    const col2 = TypeDescriptor.getProperties(obj);
    const ageDesc2 = col2.find("age");
    expect(ageDesc2?.canResetValue(obj)).toBe(true);
    ageDesc2?.resetValue(obj);
    expect(obj.age).toBe(25);
  });

  it("throws when setting read-only property", () => {
    const obj = { name: "Alice" };
    TypeDescriptor.addAttributes("Object.name", new ReadOnlyAttribute(true));
    const col = TypeDescriptor.getProperties(obj);
    const nameDesc = col.find("name");
    expect(() => nameDesc?.setValue(obj, "Bob")).toThrow();
  });

  // ───────────────────────────────────────────────
  // Attribute management
  // ───────────────────────────────────────────────
  it("adds and retrieves type-level attributes", () => {
    TypeDescriptor.addAttributes("User", new DisplayNameAttribute("User account"));
    const attrs = TypeDescriptor.getAttributes("User");
    expect(attrs.some(a => a.attributeType === "DisplayName")).toBe(true);
  });

  it("adds and retrieves instance-level attributes", () => {
    const user = { name: "Alice" };
    TypeDescriptor.addInstanceAttributes(user, new CategoryAttribute("Identity"));
    const attrs = TypeDescriptor.getInstanceAttributes(user);
    expect(attrs.some(a => a.attributeType === "Category")).toBe(true);
  });

  // ───────────────────────────────────────────────
  // Instance converter override
  // ───────────────────────────────────────────────
  it("sets and gets instance converter override", () => {
    const obj = { date: "2024-01-01" };
    TypeDescriptor.setInstanceConverter(obj, "Date");
    expect(TypeDescriptor.getInstanceConverter(obj)).toBe("Date");
  });

  // ───────────────────────────────────────────────
  // Custom converter registration
  // ───────────────────────────────────────────────
  it("registers custom converter", () => {
    TypeDescriptor.registerConverter("URL", {
      detect: (v): v is URL => v instanceof URL,
      convert: (id: string) => new URL(id),
      toString: (v: URL) => v.href,
    });
    const url = TypeDescriptor.convertFromString<URL>("https://example.com", "URL" as any) as URL;
    expect(url).toBeInstanceOf(URL);
    expect(TypeDescriptor.convertToString(url)).toBe("https://example.com/");
  });
});
