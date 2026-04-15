import { describe, it, expect } from "vitest";
import { ClaimsIdentityOptions } from "../../../src/core/options/index.js";
import { ClaimTypes } from "../../../src/claims/index.js";

describe("ClaimsIdentityOptions", () => {
  it("has correct default values", () => {
    const options = new ClaimsIdentityOptions();
    expect(options.roleClaimType).toBe(ClaimTypes.Role);
    expect(options.userNameClaimType).toBe(ClaimTypes.Name);
    expect(options.userIdClaimType).toBe(ClaimTypes.NameIdentifier);
    expect(options.emailClaimType).toBe(ClaimTypes.Email);
    expect(options.securityStampClaimType).toBe("App.Identity.SecurityStamp");
  });

  it("allows overriding roleClaimType", () => {
    const options = new ClaimsIdentityOptions();
    options.roleClaimType = "CustomRole";
    expect(options.roleClaimType).toBe("CustomRole");
  });

  it("allows overriding userNameClaimType", () => {
    const options = new ClaimsIdentityOptions();
    options.userNameClaimType = "CustomName";
    expect(options.userNameClaimType).toBe("CustomName");
  });

  it("allows overriding userIdClaimType", () => {
    const options = new ClaimsIdentityOptions();
    options.userIdClaimType = "CustomId";
    expect(options.userIdClaimType).toBe("CustomId");
  });

  it("allows overriding emailClaimType", () => {
    const options = new ClaimsIdentityOptions();
    options.emailClaimType = "CustomEmail";
    expect(options.emailClaimType).toBe("CustomEmail");
  });

  it("allows overriding securityStampClaimType", () => {
    const options = new ClaimsIdentityOptions();
    options.securityStampClaimType = "CustomSecurityStamp";
    expect(options.securityStampClaimType).toBe("CustomSecurityStamp");
  });
});
