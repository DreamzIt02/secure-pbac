import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { Exceptions } from "../../src/types/exception.js";
import { AuthorizationHandlerContext, NameAuthorizationRequirement } from "../../src/core/index.js";


describe("NameAuthorizationRequirement", () => {
  const identityAlice = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]);
//   identityAlice.name = "Alice";
  const identityBob = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")]);
//   identityBob.name = "Bob";
  const identityNoName = new ClaimsIdentity([new Claim(ClaimTypes.Email, "test@example.com")]);

  const userAlice = new ClaimsPrincipal(identityAlice);
  const userBob = new ClaimsPrincipal(identityBob);
  const userNoName = new ClaimsPrincipal(identityNoName);

  it("constructs with valid requiredName", () => {
    const req = new NameAuthorizationRequirement("Alice");
    expect(req.requiredName).toBe("Alice");
    expect(req.toString()).toContain("Requires a user identity with Name equal to Alice");
  });

  it("throws ArgumentNullException if requiredName is null", () => {
    expect(() => new NameAuthorizationRequirement(null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("succeeds when user identity name matches requiredName", async () => {
    const req = new NameAuthorizationRequirement("Alice");
    const ctx = new AuthorizationHandlerContext([req], userAlice, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("succeeds when user identity name matches case-insensitively", async () => {
    const req = new NameAuthorizationRequirement("alice");
    const ctx = new AuthorizationHandlerContext([req], userAlice, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("fails when user identity name does not match requiredName", async () => {
    const req = new NameAuthorizationRequirement("Alice");
    const ctx = new AuthorizationHandlerContext([req], userBob, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("fails when user identity has no name", async () => {
    const req = new NameAuthorizationRequirement("Alice");
    const ctx = new AuthorizationHandlerContext([req], userNoName, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("isRequirementType returns true for NameAuthorizationRequirement", () => {
    const req = new NameAuthorizationRequirement("Alice");
    expect((req as any).isRequirementType(req)).toBe(true);
  });

  it("isRequirementType returns false for other requirement", () => {
    const req = new NameAuthorizationRequirement("Alice");
    expect((req as any).isRequirementType({} as any)).toBe(false);
  });
});
