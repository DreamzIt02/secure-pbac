import { describe, it, expect } from "vitest";
import { IdentityRoleClaim } from "../../../src/core/types/index.js";
import { Claim } from "../../../src/claims/index.js";

describe("IdentityRoleClaim", () => {
  it("assigns properties correctly", () => {
    const claim = new IdentityRoleClaim<string>();
    claim.roleId = "role123";
    claim.claimType = "permission";
    claim.claimValue = "read";

    expect(claim.roleId).toBe("role123");
    expect(claim.claimType).toBe("permission");
    expect(claim.claimValue).toBe("read");
  });

  it("toClaim returns a Claim with type and value", () => {
    const claim = new IdentityRoleClaim<string>();
    claim.claimType = "role";
    claim.claimValue = "admin";

    const result = claim.toClaim();
    expect(result).toBeInstanceOf(Claim);
    expect(result.type).toBe("role");
    expect(result.value).toBe("admin");
  });

  it("initializeFromClaim copies values from another Claim", () => {
    const source = new Claim("role", "editor");
    const claim = new IdentityRoleClaim<string>();

    claim.initializeFromClaim(source);

    expect(claim.claimType).toBe("role");
    expect(claim.claimValue).toBe("editor");
  });

  it("initializeFromClaim with undefined does not throw", () => {
    const claim = new IdentityRoleClaim<string>();
    expect(() => claim.initializeFromClaim(undefined)).not.toThrow();
    expect(claim.claimType).toBeUndefined();
    expect(claim.claimValue).toBeUndefined();
  });

  it("toClaim throws if claimType or claimValue missing", () => {
    const claim = new IdentityRoleClaim<string>();
    claim.claimType = "role";
    // claimValue left undefined
    expect(() => claim.toClaim()).toThrow();
  });
});
