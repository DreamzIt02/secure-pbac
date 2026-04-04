import {
  DefaultAuthorizationPolicyProvider,
  AuthorizationOptions,
  AuthorizationPolicy,
  AuthorizationPolicyBuilder,
} from "../../src/core/index.js";
import {
  IAuthorizationRequirement,
  IAuthorizationHandler,
} from "../../src/core/types.js";

class DummyRequirement implements IAuthorizationRequirement {
  toString() {
    return "DummyRequirement";
  }
}

// class DummyPolicyBuilder {
//   private reqs: IAuthorizationRequirement[] = [];
//   private schemes: string[] = [];

//   requireAuthenticatedUser(): DummyPolicyBuilder {
//     this.reqs.push(new DummyRequirement());
//     return this;
//   }

//   build(): AuthorizationPolicy {
//     return new AuthorizationPolicy(this.reqs, this.schemes);
//   }
// }

describe("DefaultAuthorizationPolicyProvider", () => {
  let options: AuthorizationOptions;
  let provider: DefaultAuthorizationPolicyProvider;

  beforeEach(() => {
    options = new AuthorizationOptions();
    provider = new DefaultAuthorizationPolicyProvider(options);
  });

  it("should throw if constructed with null options", () => {
    expect(() => new DefaultAuthorizationPolicyProvider(null as any)).toThrow(
      "options cannot be null"
    );
  });

  it("should throw if getPolicyAsync called with empty name", async () => {
    await expect(provider.getPolicyAsync("")).rejects.toThrow(
      "Policy name cannot be null or empty."
    );
  });

  it("should return null when policy not found", async () => {
    const result = await provider.getPolicyAsync("missing");
    expect(result).toBeNull();
  });

  it("should return policy when found", async () => {
    options.addPolicy("testPolicy", (builder) => builder.requireAuthenticatedUser(), AuthorizationPolicyBuilder);
    const result = await provider.getPolicyAsync("testPolicy");
    expect(result).not.toBeNull();
    expect(result?.requirements.length).toBe(1);
  });

  it("should return default policy and cache it", async () => {
    const policy1 = await provider.getDefaultPolicyAsync();
    const policy2 = await provider.getDefaultPolicyAsync();
    expect(policy1).toStrictEqual(policy2); // cached
    expect(policy1.requirements.length).toBeGreaterThan(0);
  });

  it("should return fallback policy and cache it", async () => {
    const fallback = new AuthorizationPolicy([new DummyRequirement()], []);
    options.fallbackPolicy = fallback;
    const result1 = await provider.getFallbackPolicyAsync();
    const result2 = await provider.getFallbackPolicyAsync();
    expect(result1).toBe(result2); // cached
    expect(result1).toBe(fallback);
  });

  it("should return null when fallback policy not set", async () => {
    options.fallbackPolicy = null;
    const result = await provider.getFallbackPolicyAsync();
    expect(result).toBeNull();
  });

  it("should allow caching policies", () => {
    expect(provider.allowsCachingPolicies).toBe(true);
  });
});
