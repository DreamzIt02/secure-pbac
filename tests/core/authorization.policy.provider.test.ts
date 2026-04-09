import { describe, it, expect } from "vitest";
import { AuthorizationOptions, AuthorizationPolicy, DefaultAuthorizationPolicyProvider } from "../../src/core/index.js";
import { Exceptions } from "../../src/types/exception.js";

// Mock requirement
class MockRequirement {}

// Helper to create AuthorizationOptions
function createOptions(defaultPolicy: AuthorizationPolicy, fallbackPolicy: AuthorizationPolicy | null = null) {
  const options = new AuthorizationOptions();

  // Override methods/properties as needed
  options.getDefaultPolicy = () => defaultPolicy;
  options.fallbackPolicy = fallbackPolicy;
  options.getPolicyTask = async (name: string) => {
    if (name === "known") return defaultPolicy;
    return null;
  };

  return { value: options };
}

describe("DefaultAuthorizationPolicyProvider", () => {
  const defaultPolicy = new AuthorizationPolicy([new MockRequirement()], ["scheme1"]);
  const fallbackPolicy = new AuthorizationPolicy([new MockRequirement()], ["scheme2"]);

  it("constructs with valid options", () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy));
    expect(provider).toBeInstanceOf(DefaultAuthorizationPolicyProvider);
    expect(provider.allowsCachingPolicies).toBe(true);
  });

  it("throws ArgumentNullException if options is null", () => {
    expect(() => new DefaultAuthorizationPolicyProvider(null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("getDefaultPolicyAsync returns default policy", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy));
    const policy = await provider.getDefaultPolicyAsync();
    expect(policy).toBe(defaultPolicy);
  });

  it("getDefaultPolicyAsync caches the policy", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy));
    const p1 = await provider.getDefaultPolicyAsync();
    const p2 = await provider.getDefaultPolicyAsync();
    expect(p1).toBe(p2); // same cached instance
  });

  it("getFallbackPolicyAsync returns fallback policy", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy, fallbackPolicy));
    const policy = await provider.getFallbackPolicyAsync();
    expect(policy).toBe(fallbackPolicy);
  });

  it("getFallbackPolicyAsync caches the policy", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy, fallbackPolicy));
    const p1 = await provider.getFallbackPolicyAsync();
    const p2 = await provider.getFallbackPolicyAsync();
    expect(p1).toBe(p2);
  });

  it("getPolicyAsync returns named policy when known", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy));
    const policy = await provider.getPolicyAsync("known");
    expect(policy).toBe(defaultPolicy);
  });

  it("getPolicyAsync returns null when policy not found", async () => {
    const provider = new DefaultAuthorizationPolicyProvider(createOptions(defaultPolicy));
    const policy = await provider.getPolicyAsync("unknown");
    expect(policy).toBeNull();
  });
});
