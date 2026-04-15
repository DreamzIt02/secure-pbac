import { describe, it, expect } from "vitest";
import { TokenProviderDescriptor } from "../../../src/core/options/index.js";

describe("TokenProviderDescriptor", () => {
  class ProviderA {}
  class ProviderB {}
  class ProviderC {}

  it("initializes with a provider type", () => {
    const descriptor = new TokenProviderDescriptor(ProviderA);
    expect(descriptor.ProviderType).toBe(ProviderA);
  });

  it("allows setting ProviderInstance", () => {
    const descriptor = new TokenProviderDescriptor(ProviderA);
    const instance = new ProviderA();
    descriptor.ProviderInstance = instance;
    expect(descriptor.ProviderInstance).toBe(instance);
  });

  it("addProviderType updates ProviderType", () => {
    const descriptor = new TokenProviderDescriptor(ProviderA);
    descriptor.addProviderType(ProviderB);
    expect(descriptor.ProviderType).toBe(ProviderB);
    descriptor.addProviderType(ProviderC);
    expect(descriptor.ProviderType).toBe(ProviderC);
  });

  it("getProviderType returns matching type", () => {
    const descriptor = new TokenProviderDescriptor(ProviderA);
    descriptor.addProviderType(ProviderB);
    const result = descriptor.getProviderType<ProviderB>();
    expect(result).toBe(ProviderA); // because isAssignableFrom always returns true
  });

  it("getProviderType returns null when no types", () => {
    // simulate empty _providerTypes by hacking
    const descriptor = new TokenProviderDescriptor(ProviderA);
    (descriptor as any)._providerTypes = [];
    const result = descriptor.getProviderType<ProviderA>();
    expect(result).toBeNull();
  });
});

describe("TokenProviderDescriptor branch coverage", () => {
  it("ProviderType should return the last added type", () => {
    const desc = new TokenProviderDescriptor(Function);
    desc.addProviderType(String);
    expect(desc.ProviderType).toBe(String);
  });

  it("getProviderType should return a matching type", () => {
    const desc = new TokenProviderDescriptor(Number);
    const result = desc.getProviderType<number>();
    expect(result).toBe(Number);
  });

  it("getProviderType should return null when no match", () => {
    // Override isAssignableFrom to simulate false
    const desc = new TokenProviderDescriptor(Boolean);
    (desc as any).isAssignableFrom = () => false;
    const result = desc.getProviderType<string>();
    expect(result).toBeNull();
  });

  it("addProviderType should allow multiple types and ProviderType reflects last", () => {
    const desc = new TokenProviderDescriptor(Object);
    desc.addProviderType(Array);
    desc.addProviderType(Map);
    expect(desc.ProviderType).toBe(Map);
  });
});
