import {
  AuthorizationPolicyBuilder,
  AuthorizationPolicy,
  DefaultAuthorizationPolicyProvider,
  AssertionRequirement,
  AuthorizationOptions,
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

class DummyPolicyBuilder {
  private reqs: IAuthorizationRequirement[] = [];
  private schemes: string[] = [];

  requireAuthenticatedUser(): DummyPolicyBuilder {
    this.reqs.push(new DummyRequirement());
    return this;
  }

  build(): AuthorizationPolicy {
    return new AuthorizationPolicy(this.reqs, this.schemes);
  }
}

describe("AuthorizationPolicyBuilder", () => {
  it("should add authentication schemes", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.addAuthenticationSchemes("scheme1", "scheme2");
    expect(builder.authenticationSchemes).toEqual(["scheme1", "scheme2"]);
  });

  it("should add requirements", () => {
    const builder = new AuthorizationPolicyBuilder();
    const req = new DummyRequirement();
    builder.addRequirements(req);
    expect(builder.requirements).toContain(req);
  });

  it("should combine policies", () => {
    const policy1 = new AuthorizationPolicy([new DummyRequirement()], ["s1"]);
    const policy2 = new AuthorizationPolicy([new DummyRequirement()], ["s2"]);
    const combined = AuthorizationPolicyBuilder.combine(policy1, policy2);
    expect(combined.requirements.length).toBe(2);
    expect(combined.authenticationSchemes).toEqual(expect.arrayContaining(["s1", "s2"]));
  });

  it("should require claim", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireClaim("email");
    expect(builder.requirements[0].toString()).toContain("Claim");
  });

  it("should require role", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireRole("admin", "user");
    expect(builder.requirements[0].toString()).toContain("RolesAuthorizationRequirement");
  });

  it("should require user name", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireUserName("alice");
    expect(builder.requirements[0].toString()).toContain("UserName=alice");
  });

  it("should require authenticated user", () => {
    const builder = new AuthorizationPolicyBuilder();
    builder.requireAuthenticatedUser();
    expect(builder.requirements[0].toString()).toContain("DenyAnonymousAuthorizationRequirement");
  });

  it("should require assertion", async () => {
    const builder = new AuthorizationPolicyBuilder();
    const handler = vi.fn().mockReturnValue(true);
    builder.requireAssertion(handler);

    // Match the actual toString output
    expect(builder.requirements[0].toString()).toBe("Handler assertion should evaluate to true.");

    const req = builder.requirements[0] as AssertionRequirement;
    expect(await req.handler({} as any)).toBe(true);
  });


  it("should build policy with distinct schemes", () => {
    const builder = new AuthorizationPolicyBuilder("scheme1", "scheme1", "scheme2");
    builder.requireAssertion(() => true); // <-- add a requirement
    const policy = builder.build();
    expect(policy.authenticationSchemes).toEqual(["scheme1", "scheme2"]);
    expect(policy.requirements.length).toBe(1);
  });


  it("should combineEnumerable policies", () => {
    const policy1 = new AuthorizationPolicy([new DummyRequirement()], ["s1"]);
    const policy2 = new AuthorizationPolicy([new DummyRequirement()], ["s2"]);
    const combined = AuthorizationPolicyBuilder.combineEnumerable([policy1, policy2]);
    expect(combined.requirements.length).toBe(2);
  });

  describe("combineAsync", () => {
    let provider: DefaultAuthorizationPolicyProvider;
    let options: AuthorizationOptions;

    beforeEach(() => {
      options = new AuthorizationOptions();
      provider = new DefaultAuthorizationPolicyProvider(options);
    });

    it("should combine policy from authorizeData with policy name", async () => {
      (provider as any).options.addPolicy("p1", (b: any) => b.requireAuthenticatedUser(), DummyPolicyBuilder);
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, [{ policy: "p1" }]);
      expect(result?.requirements.length).toBeGreaterThan(0);
    });

    it("should throw if policy not found", async () => {
      await expect(
        AuthorizationPolicyBuilder.combineAsync(provider, [{ policy: "missing" }])
      ).rejects.toThrow("AuthorizationPolicy not found: missing");
    });

    it("should combine roles from authorizeData", async () => {
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, [{ roles: "admin,user" }]);
      expect(result?.requirements[0].toString()).toContain("RolesAuthorizationRequirement");
    });

    it("should combine authenticationSchemes from authorizeData", async () => {
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, [{ authenticationSchemes: "s1,s2" }]);
      expect(result?.authenticationSchemes).toEqual(expect.arrayContaining(["s1", "s2"]));
    });

    it("should use default policy when no specific data", async () => {
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, [{}]);
      expect(result?.requirements.length).toBeGreaterThan(0);
    });

    it("should combine provided policies", async () => {
      const p = new AuthorizationPolicy([new DummyRequirement()], []);
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, [], [p]);
      expect(result?.requirements.length).toBe(1);
    });

    it("should return fallback policy when no builder", async () => {
      (provider as any).options.fallbackPolicy = new AuthorizationPolicy([new DummyRequirement()], []);
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, []);
      expect(result).toBe((provider as any).options.fallbackPolicy);
    });

    it("should return null when no builder and no fallback", async () => {
      const result = await AuthorizationPolicyBuilder.combineAsync(provider, []);
      expect(result).toBeNull();
    });
  });
});
