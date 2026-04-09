import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimTypes } from "../../src/claims/index.js";


describe("ClaimsIdentity", () => {
  it("constructs with no args", () => {
    const id = new ClaimsIdentity();
    expect(id.claims).toEqual([]);
    expect(id.authenticationType).toBe(ClaimTypes.Authentication);
    expect(id.isAuthenticated).toBe(true);
  });

  it("constructs with claims only", () => {
    const claim = new Claim(ClaimTypes.Name, "Alice");
    const id = new ClaimsIdentity([claim]);
    expect(id.claims.length).toBe(1);
    expect(id.name).toBe("Alice");
  });

  it("constructs with claims and authenticationType", () => {
    const claim = new Claim(ClaimTypes.Role, "Admin");
    const id = new ClaimsIdentity([claim], "customAuth");
    expect(id.authenticationType).toBe("customAuth");
    expect(id.isAuthenticated).toBe(true);
    expect(id.roleClaimType).toBe(ClaimTypes.Role);
  });

  it("constructs with all parameters", () => {
    const claimName = new Claim("customName", "Bob");
    const claimId = new Claim("customId", "Bob");
    const id = new ClaimsIdentity(
      [claimName, claimId],
      "authType",
      "customName",
      "customRole",
      "customId"
    );
    expect(id.nameClaimType).toBe("customName");
    expect(id.roleClaimType).toBe("customRole");
    expect(id.id).toBe("Bob"); // now valid, because claimId matches customId type
    expect(id.name).toBe("Bob"); // from claimName
  });


  it("clone creates a deep copy", () => {
    const claim = new Claim(ClaimTypes.Name, "Charlie");
    const id = new ClaimsIdentity([claim], "authType");
    const clone = id.clone();
    expect(clone).not.toBe(id);
    expect(clone.claims[0].value).toBe("Charlie");
    expect(clone.authenticationType).toBe("authType");
  });

  it("addClaim adds a single claim", () => {
    const id = new ClaimsIdentity();
    const claim = new Claim(ClaimTypes.Name, "David");
    id.addClaim(claim);
    expect(id.claims.length).toBe(1);
    expect(id.name).toBe("David");
  });

  it("addClaims adds multiple claims", () => {
    const id = new ClaimsIdentity();
    const claims = [new Claim(ClaimTypes.Name, "Eve"), new Claim(ClaimTypes.Role, "User")];
    id.addClaims(claims);
    expect(id.claims.length).toBe(2);
    expect(id.name).toBe("Eve");
    expect(id.findFirst(ClaimTypes.Role)?.value).toBe("User");
  });

  it("findFirst returns undefined if not found", () => {
    const id = new ClaimsIdentity();
    expect(id.findFirst("missing")).toBeUndefined();
  });

  it("hasClaim returns true if claim exists", () => {
    const claim = new Claim(ClaimTypes.Role, "Admin");
    const id = new ClaimsIdentity([claim]);
    expect(id.hasClaim(ClaimTypes.Role, "Admin")).toBe(true);
    expect(id.hasClaim(ClaimTypes.Role, "User")).toBe(false);
  });

  it("id returns undefined if no id claim", () => {
    const id = new ClaimsIdentity();
    expect(id.id).toBeUndefined();
  });

  it("name returns undefined if no name claim", () => {
    const id = new ClaimsIdentity();
    expect(id.name).toBeUndefined();
  });
});
