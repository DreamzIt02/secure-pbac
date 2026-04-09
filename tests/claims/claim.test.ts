import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimTypes, ClaimValueTypes } from "../../src/claims/index.js";

describe("Claim", () => {
  it("constructs with type and value only", () => {
    const claim = new Claim("type1", "value1");
    expect(claim.type).toBe("type1");
    expect(claim.value).toBe("value1");
    expect(claim.valueType).toBe(ClaimValueTypes.String);
    expect(claim.issuer).toBe(ClaimTypes.DefaultIssuer);
    expect(claim.originalIssuer).toBe(ClaimTypes.DefaultIssuer);
  });

  it("constructs with type, value, and valueType", () => {
    const claim = new Claim("type2", "value2", "customType");
    expect(claim.valueType).toBe("customType");
  });

  it("constructs with issuer and originalIssuer", () => {
    const claim = new Claim("type3", "value3", undefined, "issuerX", "issuerY");
    expect(claim.issuer).toBe("issuerX");
    expect(claim.originalIssuer).toBe("issuerY");
  });

  it("constructs with subject identity", () => {
    const identity = new ClaimsIdentity();
    const claim = new Claim("type4", "value4", undefined, undefined, undefined, identity);
    expect(claim.subject).toBe(identity);
  });

  it("clone creates a new claim with same values", () => {
    const claim = new Claim("type5", "value5", "vt", "issuerA", "issuerB");
    const identity = new ClaimsIdentity();
    const clone = claim.clone(identity);
    expect(clone).not.toBe(claim);
    expect(clone.type).toBe("type5");
    expect(clone.value).toBe("value5");
    expect(clone.valueType).toBe("vt");
    expect(clone.issuer).toBe("issuerA");
    expect(clone.originalIssuer).toBe("issuerB");
    expect(clone.subject).toBe(identity);
  });

  it("equals returns true for same type and value", () => {
    const c1 = new Claim("Role", "Admin");
    const c2 = new Claim("role", "Admin");
    expect(c1.equals(c2)).toBe(true);
  });

  it("equals returns false for different type", () => {
    const c1 = new Claim("Role", "Admin");
    const c2 = new Claim("Name", "Admin");
    expect(c1.equals(c2)).toBe(false);
  });

  it("equals returns false for different value", () => {
    const c1 = new Claim("Role", "Admin");
    const c2 = new Claim("Role", "User");
    expect(c1.equals(c2)).toBe(false);
  });

  it("includes returns true when type matches and value is in allowedValues", () => {
    const c1 = new Claim("Role", "Admin");
    expect(c1.includes("role", ["Admin", "User"])).toBe(true);
  });

  it("includes returns false when type matches but value not in allowedValues", () => {
    const c1 = new Claim("Role", "Admin");
    expect(c1.includes("role", ["User"])).toBe(false);
  });

  it("includes returns true when allowedValues is undefined", () => {
    const c1 = new Claim("Role", "Admin");
    expect(c1.includes("role", undefined)).toBe(true);
  });

  it("toString returns type and value", () => {
    const c1 = new Claim("Role", "Admin");
    expect(c1.toString()).toBe("Role: Admin");
  });
});
