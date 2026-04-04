import { describe, it, expect } from 'vitest';
import { PolicyEnum, GroupPolicyEnum, GroupPolicy } from '../src/policies/index.js';

describe('GroupPolicy utilities', () => {
  it('should return SiteAdmin for Default group policy', () => {
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.Default)).toContain(PolicyEnum.SiteAdmin);
  });

  it('should return ActingAdmin policy for ActingAdmin group', () => {
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.ActingAdmin)).toContain(PolicyEnum.SiteActingAdmin);
  });

  it('should return both ActingAdmin and GeneralAdmin for GeneralAdmin group', () => {
    const policies = GroupPolicy.getGroupPolicy(GroupPolicyEnum.GeneralAdmin);
    expect(policies).toContain(PolicyEnum.SiteActingAdmin);
    expect(policies).toContain(PolicyEnum.SiteGeneralAdmin);
  });

  it('should return AdminPolicies for DepartmentAdmin group', () => {
    const policies = GroupPolicy.getGroupPolicy(GroupPolicyEnum.DepartmentAdmin);
    expect(policies).toEqual(expect.arrayContaining(GroupPolicy.AdminPolicies));
  });

  it('should return combined Admin and Manager policies for Manager group', () => {
    const policies = GroupPolicy.getGroupPolicy(GroupPolicyEnum.Manager);
    expect(policies).toEqual(expect.arrayContaining(GroupPolicy.AdminPolicies));
    expect(policies).toEqual(expect.arrayContaining(GroupPolicy.ManagerPolicies));
  });

  it('should return SignedUser policy for SignedUser group', () => {
    expect(GroupPolicy.getGroupPolicy(GroupPolicyEnum.SignedUser)).toContain(PolicyEnum.SiteSignedUser);
  });

  it('should return empty array for unknown group', () => {
    expect(GroupPolicy.getGroupPolicy(999 as GroupPolicyEnum)).toEqual([]);
  });

  // 🔹 Additional coverage

  it('should list all group policies', () => {
    expect(GroupPolicy.GroupPolicies).toContain(GroupPolicyEnum.Default);
    expect(GroupPolicy.GroupPolicies).toContain(GroupPolicyEnum.Manager);
  });

  it('should list all policies', () => {
    expect(GroupPolicy.AllPolicies).toContain(PolicyEnum.SiteAdmin);
    expect(GroupPolicy.AllPolicies).toContain(PolicyEnum.SiteManager);
  });

  it('should identify admin policies correctly', () => {
    expect(GroupPolicy.AdminPolicies).toContain(PolicyEnum.SiteGeneralAdmin);
    expect(GroupPolicy.AdminPolicies).not.toContain(PolicyEnum.SiteAdmin); // excluded
  });

  it('should identify manager policies correctly', () => {
    expect(GroupPolicy.ManagerPolicies).toContain(PolicyEnum.SiteManager);
  });

  it('should identify non-organization policies correctly', () => {
    expect(GroupPolicy.NonOrganizationPolicies).toContain(PolicyEnum.SiteSignedUser);
    expect(GroupPolicy.NonOrganizationPolicies).toContain(PolicyEnum.SiteUnSignedUser);
    expect(GroupPolicy.NonOrganizationPolicies).not.toContain(PolicyEnum.SiteGeneralAdmin);
  });

  it('should return correct policy name', () => {
    expect(GroupPolicy.authorizePolicyName(PolicyEnum.SiteManager)).toBe('SiteManager');
  });

  it('should combine groups with getComplexGroup', () => {
    const combined = GroupPolicy.getComplexGroup(
      [PolicyEnum.SiteActingAdmin],
      [PolicyEnum.SiteManager]
    );
    expect(combined).toContain(PolicyEnum.SiteActingAdmin);
    expect(combined).toContain(PolicyEnum.SiteManager);
  });

  it('should create a runtime policy claim', () => {
    const claim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteManager);
    expect(claim.type).toBe('Policy');
    expect(claim.value).toBe('SiteManager');
  });
});
