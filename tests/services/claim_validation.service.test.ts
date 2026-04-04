import { ClaimValidationService } from '../../src/services/index.js';
import { AuthorizeClaimEnum, SiteClaim } from '../../src/claims/index.js';
import { describe, it, expect } from 'vitest';

describe('ClaimValidationService', () => {
  const userClaims = [
    SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!,
    SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentContent)!,
  ];

  it('should succeed when no required claims', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(userClaims, []);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed when user has required claim', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(
      userClaims,
      [AuthorizeClaimEnum.DepartmentUser]
    );
    expect(result.succeeded).toBe(true);
  });

  it('should fail when user lacks required claim', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(
      userClaims,
      [AuthorizeClaimEnum.DepartmentFinance]
    );
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Forbidden');
  });

  it('should succeed when matchCount is met', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(
      userClaims,
      [AuthorizeClaimEnum.DepartmentUser, AuthorizeClaimEnum.DepartmentContent],
      2
    );
    expect(result.succeeded).toBe(true);
  });

  it('should fail when matchCount is not met', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(
      userClaims,
      [
        AuthorizeClaimEnum.DepartmentUser,
        AuthorizeClaimEnum.DepartmentContent,
        AuthorizeClaimEnum.DepartmentFinance,
      ],
      3
    );
    expect(result.succeeded).toBe(false);
  });

  // 🔹 Additional coverage

  it('should handle case-insensitive type/value comparison', async () => {
    const customClaims = [{ type: 'Department', value: 'departmentuser' }];
    const result = await ClaimValidationService.validateClaimsAsync(
      customClaims,
      [AuthorizeClaimEnum.DepartmentUser]
    );
    expect(result.succeeded).toBe(true);
  });

  it('should return correct error description when insufficient claims', async () => {
    const result = await ClaimValidationService.validateClaimsAsync(
      userClaims,
      [AuthorizeClaimEnum.DepartmentUser, AuthorizeClaimEnum.DepartmentFinance],
      2
    );
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].description).toContain('Insufficient claims');
  });
});
