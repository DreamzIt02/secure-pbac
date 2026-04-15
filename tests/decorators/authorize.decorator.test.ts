import { describe, it, expect } from "vitest";
import { Authorize, resolveClaimsDictionary, resolveClaimsRequirement } from "../../src/decorators/index.js";
import { ClaimsAuthorizationRequirement, RolesAuthorizationRequirement } from "../../src/core/index.js";
import { Claim } from "../../src/claims/index.js";


describe("resolveClaimsDictionary", () => {
  it("should add new claim type with value", () => {
    const dict = resolveClaimsDictionary([new Claim("role", "admin")]);
    expect(dict["role"].has("admin")).toBe(true);
  });

  it("should add value to existing claim type", () => {
    const dict = resolveClaimsDictionary([
      new Claim("role", "admin"),
      new Claim("role", "user")
    ]);
    expect(dict["role"].has("admin")).toBe(true);
    expect(dict["role"].has("user")).toBe(true);
  });

  it("should not add value when claim.value is falsy", () => {
    const dict = resolveClaimsDictionary([new Claim("role", "")]);
    expect(dict["role"].size).toBe(0);
  });
});

describe("resolveClaimsRequirement", () => {
  it("should create requirement with allowedValues when dict has values", () => {
    const claims = [new Claim("role", "admin")];
    const reqs = resolveClaimsRequirement(claims);
    expect(reqs[0]["role"].allowedValues).toContain("admin");
  });

  it("should create requirement with undefined allowedValues when dict has no values", () => {
    const claims = [new Claim("role", "")];
    const reqs = resolveClaimsRequirement(claims);
    expect(reqs[0]["role"].allowedValues).toBeUndefined();
    expect(reqs[0]["role"].emptyAllowedValues).toBe(true);
  });
});

describe("Authorize decorator", () => {
  it("should add RolesAuthorizationRequirement when roles provided", () => {
    @Authorize(["admin"])
    class TestClass {
      @Authorize(["admin"])
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs[0]).toBeInstanceOf(RolesAuthorizationRequirement);
  });

  it("should skip roles when empty iterable provided", () => {
    class TestClass {
      @Authorize([])
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs.length).toBe(0);
  });

  it("should add ClaimsAuthorizationRequirement when claims provided", () => {
    const claims = [new Claim("role", "admin")];
    class TestClass {
      @Authorize(undefined, claims)
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs[0]).toBeInstanceOf(ClaimsAuthorizationRequirement);
  });

  it("should skip roles when empty iterable provided", () => {
    const claims = [new Claim("role", "")];
    class TestClass {
      @Authorize(undefined, claims)
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs.length).toBe(1);
  });

  it("should add both roles and claims when both provided", () => {
    const claims = [new Claim("role", "admin")];
    class TestClass {
      @Authorize(["admin"], claims)
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs.some((r: any) => r instanceof RolesAuthorizationRequirement)).toBe(true);
    expect(reqs.some((r: any) => r instanceof ClaimsAuthorizationRequirement)).toBe(true);
  });

  it("should work when applied to a function (no descriptor)", () => {
    const fn = () => {};
    Authorize(["admin"])(fn, null as any, null as any);
    expect((fn as any).__requirements[0]).toBeInstanceOf(RolesAuthorizationRequirement);
  });
});

describe("resolveClaimsDictionary with Claim instances", () => {
  it("should add new claim type with Claim instance", () => {
    const dict = resolveClaimsDictionary([new Claim("role", "admin")]);
    expect(dict["role"].has("admin")).toBe(true);
  });

  it("should not add value when Claim has falsy value", () => {
    const dict = resolveClaimsDictionary([new Claim("role", "")]);
    expect(dict["role"].size).toBe(0);
  });
});

describe("resolveClaimsRequirement with Claim instances", () => {
  it("should create requirement with allowedValues when Claim has value", () => {
    const claims = [new Claim("role", "admin")];
    const reqs = resolveClaimsRequirement(claims);
    expect(reqs[0]["role"].allowedValues).toContain("admin");
  });

  it("should create requirement with undefined allowedValues when Claim has no value", () => {
    const claims = [new Claim("role", "")];
    const reqs = resolveClaimsRequirement(claims);
    expect(reqs[0]["role"].allowedValues).toBeUndefined();
    expect(reqs[0]["role"].emptyAllowedValues).toBe(true);
  });
});

describe("Authorize decorator with Claim instances", () => {
  it("should add ClaimsAuthorizationRequirement when claims provided as Claim instances", () => {
    const claims = [new Claim("role", "admin")];
    class TestClass {
      @Authorize(undefined, claims)
      method() {}
    }
    const fn = Object.getOwnPropertyDescriptor(TestClass.prototype, "method")?.value as any;
    const reqs = fn.__requirements;
    expect(reqs[0]).toBeInstanceOf(ClaimsAuthorizationRequirement);
  });

});
