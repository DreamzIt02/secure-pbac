import { PolicyValidationService } from '../../src/services/index.js';
import { PolicyEnum, GroupPolicy } from '../../src/policies/index.js';
import { Claim } from '../../src/claims/index.js';
import { describe, it, expect } from 'vitest';

describe('PolicyValidationService', () => {
  const siteAdminClaim: Claim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteAdmin);
  const actingAdminClaim: Claim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteActingAdmin);
  const generalAdminClaim: Claim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteGeneralAdmin);

  const userWithAdmin: Claim[] = [siteAdminClaim];
  const userWithActing: Claim[] = [actingAdminClaim];
  const userWithGeneral: Claim[] = [generalAdminClaim];
  const userWithoutClaims: Claim[] = [];

  it('should succeed when user has default admin and checkDefault is true', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithAdmin, [PolicyEnum.SiteGeneralAdmin], true);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed when user has required acting admin claim', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithActing, [PolicyEnum.SiteActingAdmin]);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed when user has required general admin claim', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithGeneral, [PolicyEnum.SiteGeneralAdmin]);
    expect(result.succeeded).toBe(true);
  });

  it('should fail when user lacks required policies', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithoutClaims, [PolicyEnum.SiteGeneralAdmin]);
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Forbidden');
  });

  it('should fail when user lacks multiple required policies', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithoutClaims, [PolicyEnum.SiteGeneralAdmin, PolicyEnum.SiteManager]);
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].description).toContain('SiteGeneralAdmin');
    expect(result.errors?.[0].description).toContain('SiteManager');
  });

  it('should succeed for validatePolicyAsync when claim exists', async () => {
    const result = await PolicyValidationService.validatePolicyAsync(userWithActing, PolicyEnum.SiteActingAdmin);
    expect(result.succeeded).toBe(true);
  });

  it('should fail for validatePolicyAsync when claim missing', async () => {
    const result = await PolicyValidationService.validatePolicyAsync(userWithoutClaims, PolicyEnum.SiteManager);
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].description).toContain('Missing SiteManager');
  });

  // 🔹 Additional coverage

  it('should handle empty requiredPolicies gracefully', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(userWithoutClaims, []);
    expect(result.succeeded).toBe(false);
  });

  it('should handle multiple claims and succeed on first match', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync(
      [actingAdminClaim, generalAdminClaim],
      [PolicyEnum.SiteGeneralAdmin, PolicyEnum.SiteActingAdmin]
    );
    expect(result.succeeded).toBe(true);
  });

  it('should fail when requiredPolicies is empty and checkDefault is false', async () => {
    const result = await PolicyValidationService.validatePoliciesAsync([], []);
    expect(result.succeeded).toBe(false);
  });
  
});
