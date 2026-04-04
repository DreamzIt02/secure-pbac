import { describe, it, expect } from 'vitest';
import { SiteClaim, AuthorizeClaimEnum, AuthorizeClaimTypeEnum } from '../src/claims/index.js';

describe('SiteClaim utilities', () => {
  it('should return claim names for Department type', () => {
    const names = SiteClaim.authorizeClaimNames(AuthorizeClaimTypeEnum.Department);
    expect(names).toContain('departmentuser');
    expect(names).toContain('departmentcontent');
  });

  it('should create a new sign-in claim', () => {
    const claim = SiteClaim.newSignInClaim();
    expect(claim.type).toBe('sign_in');
    expect(claim.value).toBeDefined();
  });

  it('should create a new claim for DepartmentUser', () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser);
    expect(claim?.type.toLowerCase()).toBe('department');
    expect(claim?.value).toBe('departmentuser');
  });

  it('should create a valid default claim', () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.Default);
    expect(claim).toEqual({ type: 'Default', value: 'default' });
  });

  it('should create a list of claims', () => {
    const claims = SiteClaim.newClaimList([
      AuthorizeClaimEnum.DepartmentUser,
      AuthorizeClaimEnum.DepartmentFinance,
    ]);
    expect(claims.length).toBe(2);
    expect(claims[0].value).toBe('departmentuser');
    expect(claims[1].value).toBe('departmentfinance');
  });

  it('should compare types correctly', () => {
    expect(
      SiteClaim.isTypeEqual(
        'department',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department'
      )
    ).toBe(true);
  });

  it('should compare values correctly', () => {
    expect(SiteClaim.isValueEqual('departmentuser', 'DepartmentUser')).toBe(true);
  });

  it('should return null when authorizeClaimType does not match', () => {
    expect(SiteClaim.authorizeClaimType('invalid')).toBeNull();
  });

  it('should return null from getType when input is empty', () => {
    expect(SiteClaim.getType('')).toBeNull();
  });

  it('should return null from getValue when input is empty', () => {
    expect(SiteClaim.getValue('')).toBeNull();
  });

  it('should handle isTypeEqual with mismatched values', () => {
    expect(SiteClaim.isTypeEqual('department', 'finance')).toBe(false);
  });

  it('should handle isValueEqual with mismatched values', () => {
    expect(SiteClaim.isValueEqual('departmentuser', 'departmentfinance')).toBe(false);
  });

  // 🔹 Additional coverage

  it('should return all claim names and values', () => {
    expect(SiteClaim.AllClaimNames).toContain('DepartmentUser');
    expect(SiteClaim.AllClaimValues).toContain(AuthorizeClaimEnum.DepartmentUser);
  });

  it('should return all claim type names and values', () => {
    expect(SiteClaim.AllClaimTypeNames).toContain('Department');
    expect(SiteClaim.AllClaimTypeValues).toContain(AuthorizeClaimTypeEnum.Department);
  });

  it('should resolve authorizeClaimType from enum', () => {
    const type = SiteClaim.authorizeClaimType(AuthorizeClaimEnum.DepartmentUser);
    expect(type?.toLowerCase()).toBe('department');
  });

  it('should resolve authorizeClaimType from string', () => {
    const type = SiteClaim.authorizeClaimType('departmentuser');
    expect(type?.toLowerCase()).toBe('department');
  });

  it('should normalize type with getType', () => {
    const typ = SiteClaim.getType('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department');
    expect(typ).toBe('department');
  });

  it('should normalize value with getValue', () => {
    const val = SiteClaim.getValue('DepartmentUser');
    expect(val).toBe('departmentuser');
  });
  
  it('should handle getType with null input', () => {
    expect(SiteClaim.getType(null as any)).toBeNull();
  });

  it('should handle getValue with null input', () => {
    expect(SiteClaim.getValue(null as any)).toBeNull();
  });

  it('should return false for isTypeEqual when both inputs differ', () => {
    expect(SiteClaim.isTypeEqual('department', 'random')).toBe(false);
  });

  it('should return false for isValueEqual when both inputs differ', () => {
    expect(SiteClaim.isValueEqual('departmentuser', 'random')).toBe(false);
  });
});
