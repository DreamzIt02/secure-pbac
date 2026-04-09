import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { Exceptions } from "../../src/types/exception.js";
import { AuthorizationHandlerContext, ClaimsAuthorizationRequirement } from "../../src/core/index.js";


describe("ClaimsAuthorizationRequirement", () => {
  const userWithNameAlice = new ClaimsPrincipal(
    new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")])
  );

  const userWithNameBob = new ClaimsPrincipal(
    new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")])
  );

  const userWithOtherClaim = new ClaimsPrincipal(
    new ClaimsIdentity([new Claim("OtherType", "Charlie")])
  );

  it("constructs with claimType only", () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name);
    expect(req.claimType).toBe(ClaimTypes.Name);
    expect(req.toString()).toContain("ClaimsAuthorizationRequirement:Claim.Type=");
  });

  it("constructs with claimType and allowedValues", () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name, ["Alice", "Bob"]);
    expect(req.toString()).toContain("Claim.Value is one of the following values");
  });

  it("throws ArgumentNullException if claimType is null", () => {
    expect(() => new ClaimsAuthorizationRequirement(null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("succeeds when user has matching claim type and no allowedValues", async () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name);
    const ctx = new AuthorizationHandlerContext([req], userWithNameAlice, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("succeeds when user has matching claim type and allowed value", async () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name, ["Alice"]);
    const ctx = new AuthorizationHandlerContext([req], userWithNameAlice, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("fails when user has matching claim type but not allowed value", async () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name, ["Alice"]);
    const ctx = new AuthorizationHandlerContext([req], userWithNameBob, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("fails when user does not have matching claim type", async () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name);
    const ctx = new AuthorizationHandlerContext([req], userWithOtherClaim, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("isRequirementType returns true for ClaimsAuthorizationRequirement", () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name);
    expect((req as any).isRequirementType(req)).toBe(true);
  });

  it("isRequirementType returns false for other requirement", () => {
    const req = new ClaimsAuthorizationRequirement(ClaimTypes.Name);
    expect((req as any).isRequirementType({} as any)).toBe(false);
  });
});
