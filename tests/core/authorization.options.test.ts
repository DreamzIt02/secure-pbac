import { beforeEach, describe, expect, it } from "vitest";
import {
  AuthorizationPolicy,
  AuthorizationOptions,
} from "../../src/core/index.js";
import { IAuthorizationRequirement } from "../../src/core/types/index.js";
import { Exceptions } from "../../src/types/exception.js";


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

describe("AuthorizationPolicy", () => {
  it("should throw if requirements are null", () => {
    expect(() => new AuthorizationPolicy(null as any, [])).toThrow(
      "ArgumentNullException"
    );
  });

  it("should throw if authenticationSchemes are null", () => {
    expect(() => new AuthorizationPolicy([new DummyRequirement()], null as any)).toThrow(
      "ArgumentNullException"
    );
  });

  it("should throw if requirements are empty", () => {
    expect(() => new AuthorizationPolicy([], [])).toThrow(
      "AuthorizationPolicy must have at least one requirement."
    );
  });

  it("should freeze requirements and schemes", () => {
    const req = new DummyRequirement();
    const policy = new AuthorizationPolicy([req], ["scheme1"]);
    expect(policy.requirements[0]).toBe(req);
    expect(policy.authenticationSchemes[0]).toBe("scheme1");
    expect(Object.isFrozen(policy.requirements)).toBe(true);
    expect(Object.isFrozen(policy.authenticationSchemes)).toBe(true);
  });
});

describe("AuthorizationOptions", () => {
  let options: AuthorizationOptions;

  beforeEach(() => {
    options = new AuthorizationOptions();
  });

  it("should build default policy using builder", () => {
    const policy = options.getDefaultPolicy(DummyPolicyBuilder);
    expect(policy.requirements.length).toBeGreaterThan(0);
  });

  it("should add and retrieve a policy", async () => {
    options.addPolicy("testPolicy", (builder) => {
      builder.requireAuthenticatedUser();
    }, DummyPolicyBuilder);

    const policy = await options.getPolicy("testPolicy");
    expect(policy).not.toBeNull();
    expect(policy?.requirements.length).toBe(1);
  });

  it("should return null for non-existent policy", async () => {
    const policy = await options.getPolicy("missingPolicy");
    expect(policy).toBeNull();
  });

  it("should throw when adding policy with empty name", () => {
    expect(() =>
      options.addPolicy("", () => {}, DummyPolicyBuilder)
    ).toThrow(Exceptions.ArgumentNullOrEmptyException.message);
  });

  it("should throw when adding policy with null configurePolicy", () => {
    expect(() =>
      options.addPolicy("badPolicy", null as any, DummyPolicyBuilder)
    ).toThrow("ArgumentNullException");
  });

  it("should throw when getPolicy called with empty name", async () => {
    await expect(options.getPolicy("")).rejects.toThrow(
      Exceptions.ArgumentNullOrEmptyException.message
    );
  });

  it("internalGetPolicyTask returns nullPolicyPromise when not found", async () => {
    const result = await options.getPolicyTask("missing");
    expect(result).toBeNull();
  });

  it("internalGetPolicyTask returns stored policy", async () => {
    options.addPolicy("stored", (builder) => builder.requireAuthenticatedUser(), DummyPolicyBuilder);
    const result = await options.getPolicyTask("stored");
    expect(result).not.toBeNull();
  });
});
