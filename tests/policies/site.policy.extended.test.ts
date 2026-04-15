import { describe, it, expect } from "vitest";
import { GroupPolicy, GroupPolicyEnum, PolicyEnum, SitePolicy } from "../../src/policies/index.js";
import { Claim, ClaimsIdentity, ClaimsPrincipal } from "../../src/claims/index.js";
import { HttpContext } from "../../src/http/index.js";

describe("SitePolicy", () => {
  it("isDefaultAdmin returns true only for SiteAdmin", () => {
    expect(SitePolicy.isDefaultAdmin(PolicyEnum.SiteAdmin)).toBe(true);
    expect(SitePolicy.isDefaultAdmin(PolicyEnum.SiteManager)).toBe(false);
  });

  it("isActingAdmin returns true only for SiteActingAdmin", () => {
    expect(SitePolicy.isActingAdmin(PolicyEnum.SiteActingAdmin)).toBe(true);
    expect(SitePolicy.isActingAdmin(PolicyEnum.SiteAdmin)).toBe(false);
  });

  it("isGeneraleAdmin returns true only for SiteGeneralAdmin", () => {
    expect(SitePolicy.isGeneraleAdmin(PolicyEnum.SiteGeneralAdmin)).toBe(true);
    expect(SitePolicy.isGeneraleAdmin(PolicyEnum.SiteManager)).toBe(false);
  });
});

describe("GroupPolicy", () => {
  it("GroupPolicies contains numeric values", () => {
    expect(GroupPolicy.GroupPolicies).toContain(GroupPolicyEnum.Default);
  });

  it("AllPolicies contains numeric values", () => {
    expect(GroupPolicy.AllPolicies).toContain(PolicyEnum.SiteAdmin);
  });

  it("AdminPolicies contains admin policies except SiteAdmin", () => {
    expect(GroupPolicy.AdminPolicies).toContain(PolicyEnum.SiteGeneralAdmin);
    expect(GroupPolicy.AdminPolicies).not.toContain(PolicyEnum.SiteAdmin);
  });

  it("ManagerPolicies contains manager policies", () => {
    expect(GroupPolicy.ManagerPolicies).toContain(PolicyEnum.SiteManager);
  });

  it("NonOrganizationPolicies excludes admin and manager", () => {
    expect(GroupPolicy.NonOrganizationPolicies).toContain(PolicyEnum.SiteSignedUser);
    expect(GroupPolicy.NonOrganizationPolicies).not.toContain(PolicyEnum.SiteManager);
  });

  it("authorizePolicyName returns string name", () => {
    expect(GroupPolicy.authorizePolicyName(PolicyEnum.SiteAdmin)).toBe("SiteAdmin");
  });

  it("getGroupPolicy returns correct policies for each enum", () => {
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.Default)).toEqual([PolicyEnum.SiteAdmin]);
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.ActingAdmin)).toEqual([PolicyEnum.SiteActingAdmin]);
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.GeneralAdmin)).toEqual([PolicyEnum.SiteActingAdmin, PolicyEnum.SiteGeneralAdmin]);
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.DepartmentAdmin)).toEqual(expect.arrayContaining(GroupPolicy.AdminPolicies));
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.Manager)).toEqual(expect.arrayContaining([...GroupPolicy.AdminPolicies, ...GroupPolicy.ManagerPolicies]));
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.SignedUser)).toEqual([PolicyEnum.SiteSignedUser]);
    expect(GroupPolicy.getGroupPolicy(999 as any)).toEqual([]);
  });

  it("getComplexGroup merges groups", () => {
    const merged = GroupPolicy.getComplexGroup([PolicyEnum.SiteAdmin], [PolicyEnum.SiteManager]);
    expect(merged).toEqual([PolicyEnum.SiteAdmin, PolicyEnum.SiteManager]);
  });

  it("requestPolicyClaim creates claim", () => {
    const claim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteAdmin);
    expect(claim.type).toBe("Policy");
    expect(claim.value).toBe("SiteAdmin");
  });

  it("requestPolicyHeader creates header", () => {
    const header = GroupPolicy.requestPolicyHeader(PolicyEnum.SiteAdmin);
    expect(header.key).toBe("Policy");
    expect(header.value).toBe("SiteAdmin");
  });

  it("addRequestPolicy adds claim to principal", () => {
    const principal = new ClaimsPrincipal([]);
    GroupPolicy.addRequestPolicy(principal, PolicyEnum.SiteAdmin);
    expect(principal.hasClaim(c => c.type === "Policy" && c.value === "SiteAdmin")).toBe(true);
  });

  it("isRequestFromWho detects via header", () => {
    const context: HttpContext = {
      request: { headers: { policy: "siteadmin" } },
      user: new ClaimsPrincipal([])
    } as any;
    expect(GroupPolicy.isRequestFromDefaultAdmin(context)).toBe(true);
  });

  it("isRequestFromWho detects via claim", () => {
    const claim = new Claim("Policy", "SiteManager");
    const identity = new ClaimsIdentity();
    identity.addClaim(claim);
    const principal = new ClaimsPrincipal([identity]);
    const context: HttpContext = { request: { headers: {} }, user: principal } as any;
    expect(GroupPolicy.isRequestFromManager(context)).toBe(true);
  });

  it("isRequestFromWho returns false if no match", () => {
    const context: HttpContext = { request: { headers: {} }, user: new ClaimsPrincipal([]) } as any;
    expect(GroupPolicy.isRequestFromGeneralAdmin(context)).toBe(false);
  });
});
