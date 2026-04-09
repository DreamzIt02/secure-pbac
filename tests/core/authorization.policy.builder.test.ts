import { describe, it, expect } from "vitest";
import { AssertionRequirement, AuthorizationOptions, AuthorizationPolicy, AuthorizationPolicyBuilder, ClaimsAuthorizationRequirement, DefaultAuthorizationPolicyProvider, NameAuthorizationRequirement, RolesAuthorizationRequirement } from "../../src/core/index.js";


// Helper to create a simple policy
function makePolicy() {
  return new AuthorizationPolicy([new ClaimsAuthorizationRequirement("Name")], ["scheme1"]);
}

describe("AuthorizationPolicyBuilder", () => {
  it("constructor adds authentication schemes", () => {
    const builder = new AuthorizationPolicyBuilder("scheme1", "scheme2");
    expect(builder.authenticationSchemes).toEqual(["scheme1", "scheme2"]);
  });

  it("addAuthenticationSchemes adds schemes", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.addAuthenticationSchemes("schemeA", "schemeB");
    expect(builder.authenticationSchemes).toContain("schemeA");
    expect(builder.authenticationSchemes).toContain("schemeB");
  });

  it("addRequirements adds requirements", () => {
    const builder = new AuthorizationPolicyBuilder();
    const req = new ClaimsAuthorizationRequirement("Name");
    builder.addRequirements(req);
    expect(builder.requirements).toContain(req);
  });

  it("combine merges another policy", () => {
    const builder = new AuthorizationPolicyBuilder();
    const policy = makePolicy();
    builder.combine(policy);
    expect(builder.authenticationSchemes).toContain("scheme1");
    expect(builder.requirements.length).toBeGreaterThan(0);
  });

  it("requireClaim adds ClaimsAuthorizationRequirement", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireClaim("Name", ["Alice"]);
    expect(builder.requirements[0]).toBeInstanceOf(ClaimsAuthorizationRequirement);
  });

  it("requireRole adds RolesAuthorizationRequirement", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireRole("Admin", "User");
    expect(builder.requirements[0]).toBeInstanceOf(RolesAuthorizationRequirement);
  });

  it("requireUserName adds NameAuthorizationRequirement", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireUserName("Alice");
    expect(builder.requirements[0]).toBeInstanceOf(NameAuthorizationRequirement);
  });

  it("requireAuthenticatedUser adds DenyAnonymousAuthorizationRequirement", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireAuthenticatedUser();
    expect(builder.requirements[0].toString()).toContain("DenyAnonymousAuthorizationRequirement");
  });

  it("requireAssertion adds AssertionRequirement", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireAssertion(() => true);
    expect(builder.requirements[0]).toBeInstanceOf(AssertionRequirement);
  });

  it("build creates AuthorizationPolicy with distinct schemes", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.addAuthenticationSchemes("scheme1", "scheme1"); // duplicate
    builder.requireClaim("Name");
    const policy = builder.build();
    expect(policy).toBeInstanceOf(AuthorizationPolicy);
    expect(policy.authenticationSchemes).toEqual(["scheme1"]);
  });

  it("fromPolicy creates builder from existing policy", () => {
    const policy = makePolicy();
    const builder = AuthorizationPolicyBuilder.fromPolicy(policy);
    expect(builder.requirements.length).toBeGreaterThan(0);
  });

  it("combine static merges multiple policies", () => {
    const p1 = makePolicy();
    const p2 = makePolicy();
    const combined = AuthorizationPolicyBuilder.combine(p1, p2);
    expect(combined.requirements.length).toBeGreaterThan(0);
  });

  it("combineEnumerable merges multiple policies", () => {
    const p1 = makePolicy();
    const p2 = makePolicy();
    const combined = AuthorizationPolicyBuilder.combineEnumerable([p1, p2]);
    expect(combined.requirements.length).toBeGreaterThan(0);
  });

  it("combineAsync merges authorizeData with policyProvider", async () => {
    const options = new AuthorizationOptions();
    const provider = new DefaultAuthorizationPolicyProvider({ value: options });
    const authorizeData = [{ policy: "default", roles: "Admin,User", authenticationSchemes: "schemeX" }];
    // Add a policy to options
    options.addPolicy("default", b => b.requireClaim("Name"), AuthorizationPolicyBuilder);
    const result = await AuthorizationPolicyBuilder.combineAsync(provider, authorizeData);
    expect(result).toBeInstanceOf(AuthorizationPolicy);
    expect(result!.requirements.length).toBeGreaterThan(0);
  });

  it("combineAsync returns fallbackPolicy if no authorizeData or policies", async () => {
    const options = new AuthorizationOptions();
    const fallback = makePolicy();
    options.fallbackPolicy = fallback;
    const provider = new DefaultAuthorizationPolicyProvider({ value: options });
    const result = await AuthorizationPolicyBuilder.combineAsync(provider, []);
    expect(result).toBe(fallback);
  });

  it("combineAsync returns null if no data and no fallback", async () => {
    const options = new AuthorizationOptions();
    const provider = new DefaultAuthorizationPolicyProvider({ value: options });
    const result = await AuthorizationPolicyBuilder.combineAsync(provider, []);
    expect(result).toBeNull();
  });

  it("combineAsync throws if policy not found", async () => {
    const options = new AuthorizationOptions();
    const provider = new DefaultAuthorizationPolicyProvider({ value: options });
    const authorizeData = [{ policy: "missing" }];
    await expect(AuthorizationPolicyBuilder.combineAsync(provider, authorizeData))
      .rejects.toThrow("AuthorizationPolicy not found: missing");
  });
});
