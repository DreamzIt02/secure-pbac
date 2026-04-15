import { describe, it, expect, vi } from "vitest";
import { AuthorizationOptions } from "../../src/core/index.js";
import { AuthorizationExtensions } from "../../src/policy/index.js";

// Dummy AuthorizationOptions implementation for testing
class DummyAuthorizationOptions extends AuthorizationOptions {
  public policies: Record<string, any> = {};
  addPolicy(name: string, configure: (builder: any) => void, builderType: any) {
    const builder = new builderType();
    // Spy on builder methods
    builder.addAuthenticationSchemes = vi.fn();
    builder.requireRole = vi.fn();
    builder.requireClaim = vi.fn();
    configure(builder);
    this.policies[name] = builder;
  }
}

// Concrete subclass of AuthorizationExtensions for testing
class TestAuthorizationExtensions extends AuthorizationExtensions {
  constructor(options: AuthorizationOptions) {
    super(options);
  }
}

describe("AuthorizationExtensions", () => {
  it("adds all policies with roles and claims", () => {
    const options = new DummyAuthorizationOptions();
    const ext = new TestAuthorizationExtensions(options);

    const result = ext.addPolicyAuthorization();

    expect(result).toBe(options);
    // Verify that policies were added
    expect(Object.keys(options.policies).length).toBeGreaterThan(0);

    // Check a policy with roles
    const siteAdminPolicy = options.policies["SiteAdmin"];
    expect(siteAdminPolicy.addAuthenticationSchemes).toHaveBeenCalled();
    expect(siteAdminPolicy.requireRole).toHaveBeenCalled();

    // Check a policy with claims
    const siteSignedUserPolicy = options.policies["SiteSignedUser"];
    expect(siteSignedUserPolicy.requireClaim).toHaveBeenCalled();
  });

  it("applies configureOptions function to authOptions", () => {
    const options = new DummyAuthorizationOptions();
    const ext = new TestAuthorizationExtensions(options);

    const configureFn = vi.fn((opt) => opt);
    ext.addPolicyAuthorization(configureFn);

    expect(configureFn).toHaveBeenCalledWith(options);
  });

  it("returns updated AuthorizationOptions", () => {
    const options = new DummyAuthorizationOptions();
    const ext = new TestAuthorizationExtensions(options);

    const updated = ext.addPolicyAuthorization();
    expect(updated).toBe(options);
  });
});
