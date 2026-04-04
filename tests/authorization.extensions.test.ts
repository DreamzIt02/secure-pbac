import { AuthorizationExtensions } from '../src/di/authorization.extensions.js';
import { PolicyEnum, GroupPolicy } from '../src/policies/index.js';
import { SiteRole } from '../src/roles/index.js';
import { SiteClaim, AuthorizeClaimTypeEnum } from '../src/claims/index.js';
import { describe, it, expect } from 'vitest';

describe('AuthorizationExtensions', () => {
  const policies = AuthorizationExtensions.addPolicyAuthorization();

  it('should include SiteAdmin policy with DefaultRole', () => {
    const adminPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteAdmin));
    expect(adminPolicy?.requiredRoles).toContain(SiteRole.DefaultRole);
  });

  it('should include ActingAdmin policy with correct role', () => {
    const actingPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteActingAdmin));
    expect(actingPolicy?.requiredRoles?.[0]).toMatch(/ActingAdmin/i);
  });

  it('should include GeneralAdmin policy with correct role', () => {
    const generalPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteGeneralAdmin));
    expect(generalPolicy?.requiredRoles?.[0]).toMatch(/GeneralAdmin/i);
  });

  it('should include DepartmentAdmin policy with role and claim type', () => {
    const deptPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteDepartmentAdmin));
    expect(deptPolicy?.requiredRoles?.[0]).toMatch(/DepartmentAdmin/i);
    expect(deptPolicy?.requiredClaims?.type).toBe(SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department));
  });

  it('should include Manager policy with role and claim type', () => {
    const managerPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteManager));
    expect(managerPolicy?.requiredRoles?.[0]).toMatch(/Manager/i);
    expect(managerPolicy?.requiredClaims?.type).toBe(SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department));
  });

  it('should include SignedUser policy with SignInClaimType', () => {
    const signedPolicy = policies.find(p => p.name === GroupPolicy.authorizePolicyName(PolicyEnum.SiteSignedUser));
    expect(signedPolicy?.requiredClaims?.type).toBe(SiteClaim.SignInClaimType);
    expect(signedPolicy?.requiredClaims?.values).toEqual([]);
  });

  // 🔹 Additional coverage
  it('should return all policies as array', () => {
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);
  });

  it('should not include unknown policy', () => {
    const unknown = policies.find(p => p.name === 'UnknownPolicy');
    expect(unknown).toBeUndefined();
  });
});
