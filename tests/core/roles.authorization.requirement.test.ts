import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationHandlerContext, RolesAuthorizationRequirement } from "../../src/core/index.js";
import { Exceptions, InvalidOperationException } from "../../src/types/exception.js";

describe("RolesAuthorizationRequirement", () => {
  const identityAdmin = new ClaimsIdentity([new Claim(ClaimTypes.Role, "Admin"), new Claim(ClaimTypes.Name, "Alice")]);
  const identityUser = new ClaimsIdentity([new Claim(ClaimTypes.Role, "User"), new Claim(ClaimTypes.Name, "Bob")]);
  const identityNoRole = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Charlie")]);

  const userWithAdminRole = new ClaimsPrincipal(identityAdmin);
  const userWithUserRole = new ClaimsPrincipal(identityUser);
  const userWithNoRoles = new ClaimsPrincipal(identityNoRole);

  it("constructs with valid roles", () => {
    const req = new RolesAuthorizationRequirement(["Admin", "User"]);
    expect([...req.allowedRoles]).toEqual(["Admin", "User"]);
    expect(req.toString()).toContain("Requires user in one of the roles");
  });

  it("throws ArgumentNullException if roles is null", () => {
    expect(() => new RolesAuthorizationRequirement(null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throws InvalidOperationException if roles is empty", () => {
    expect(() => new RolesAuthorizationRequirement([]))
      .toThrow(InvalidOperationException);
  });

  it("succeeds when user has one of the allowed roles", async () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    const ctx = new AuthorizationHandlerContext([req], userWithAdminRole, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(true);
  });

  it("fails when user does not have any allowed roles", async () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    const ctx = new AuthorizationHandlerContext([req], userWithUserRole, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("fails when user has no roles", async () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    const ctx = new AuthorizationHandlerContext([req], userWithNoRoles, null);
    await req.handleAsync(ctx);
    expect(ctx.hasSucceeded).toBe(false);
  });

  it("isRequirementType returns true for RolesAuthorizationRequirement", () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    expect((req as any).isRequirementType(req)).toBe(true);
  });

  it("isRequirementType returns false for other requirement", () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    expect((req as any).isRequirementType({} as any)).toBe(false);
  });
});
