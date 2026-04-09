import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes, SecurityHelper } from "../../src/claims/index.js";


describe("SecurityHelper.mergeUserPrincipal", () => {
  it("returns additionalPrincipal when existingPrincipal is null", () => {
    const additional = new ClaimsPrincipal(
      new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")])
    );
    const result = SecurityHelper.mergeUserPrincipal(null, additional);
    expect(result).toBe(additional);
  });

  it("returns new principal with only existing identities when additionalPrincipal is null", () => {
    const existing = new ClaimsPrincipal(
      new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")])
    );
    const result = SecurityHelper.mergeUserPrincipal(existing, null);
    expect(result).not.toBe(existing); // new instance
    expect(result.identities.length).toBe(1);
    expect(result.identities[0].name).toBe("Bob");
  });

  it("merges both principals with additional identities first", () => {
    const existing = new ClaimsPrincipal(
      new ClaimsIdentity([new Claim(ClaimTypes.Name, "Charlie")])
    );
    const additional = new ClaimsPrincipal(
      new ClaimsIdentity([new Claim(ClaimTypes.Name, "Dave")])
    );
    const result = SecurityHelper.mergeUserPrincipal(existing, additional);
    expect(result.identities.length).toBe(2);
    expect(result.identities[0].name).toBe("Dave"); // additional first
    expect(result.identities[1].name).toBe("Charlie");
  });

  it("filters out unauthenticated identities with no claims", () => {
    const emptyUnauth = new ClaimsIdentity();
    // force unauthenticated by clearing authenticationType
    const unauth = new ClaimsIdentity();
    (unauth as any)._authenticationType = "";
    const existing = new ClaimsPrincipal(unauth);
    const additional = new ClaimsPrincipal(
      new ClaimsIdentity([new Claim(ClaimTypes.Name, "Eve")])
    );
    const result = SecurityHelper.mergeUserPrincipal(existing, additional);
    expect(result.identities.length).toBe(1);
    expect(result.identities[0].name).toBe("Eve");
  });

  it("keeps unauthenticated identities if they have claims", () => {
    const unauthWithClaims = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Frank")]);
    (unauthWithClaims as any)._authenticationType = ""; // unauthenticated but has claims
    const existing = new ClaimsPrincipal(unauthWithClaims);
    const result = SecurityHelper.mergeUserPrincipal(existing, null);
    expect(result.identities.length).toBe(1);
    expect(result.identities[0].name).toBe("Frank");
  });

  it("returns empty principal when both are null", () => {
    const result = SecurityHelper.mergeUserPrincipal(null, null);
    expect(result.identities.length).toBe(0);
  });
});
