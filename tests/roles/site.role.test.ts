import { describe, expect, it } from 'vitest';
import { AuthorizeRoleEnum, SiteRole } from '../../src/roles/index.js';

describe('SiteRole class', () => {
  it('should include all roles', () => {
    expect(SiteRole.AllRoles).toContain(AuthorizeRoleEnum.Default);
    expect(SiteRole.AllRoles).toContain(AuthorizeRoleEnum.AuthorizeActingAdmin);
    expect(SiteRole.AllRoles).toContain(AuthorizeRoleEnum.AuthorizeGeneralAdmin);
    expect(SiteRole.AllRoles).toContain(AuthorizeRoleEnum.AuthorizeDepartmentAdmin);
    expect(SiteRole.AllRoles).toContain(AuthorizeRoleEnum.AuthorizeManager);
  });

  it('should include all role names', () => {
    expect(SiteRole.AllRoleNames).toContain('AuthorizeActingAdmin');
    expect(SiteRole.AllRoleNames).toContain('AuthorizeGeneralAdmin');
  });

  it('should identify administrative roles correctly (enum)', () => {
    expect(SiteRole.isAdministrativeRole(AuthorizeRoleEnum.Default)).toBe(true);
    expect(SiteRole.isAdministrativeRole(AuthorizeRoleEnum.AuthorizeActingAdmin)).toBe(true);
    expect(SiteRole.isAdministrativeRole(AuthorizeRoleEnum.AuthorizeGeneralAdmin)).toBe(true);
    expect(SiteRole.isAdministrativeRole(AuthorizeRoleEnum.AuthorizeDepartmentAdmin)).toBe(true);
    expect(SiteRole.isAdministrativeRole(AuthorizeRoleEnum.AuthorizeManager)).toBe(true);
  });

  it('should identify administrative roles correctly (string)', () => {
    expect(SiteRole.isAdministrativeRole('AuthorizeActingAdmin')).toBe(true);
    expect(SiteRole.isAdministrativeRole('AuthorizeGeneralAdmin')).toBe(true);
    expect(SiteRole.isAdministrativeRole('AuthorizeDepartmentAdmin')).toBe(true);
    expect(SiteRole.isAdministrativeRole('AuthorizeManager')).toBe(true);
    expect(SiteRole.isAdministrativeRole('InvalidRole')).toBe(false);
  });

  it('should identify department admin role', () => {
    expect(SiteRole.isDepartmentAdminRole(AuthorizeRoleEnum.AuthorizeDepartmentAdmin)).toBe(true);
    expect(SiteRole.isDepartmentAdminRole(AuthorizeRoleEnum.AuthorizeManager)).toBe(false);
    expect(SiteRole.isDepartmentAdminRole('AuthorizeDepartmentAdmin')).toBe(true);
    expect(SiteRole.isDepartmentAdminRole('AuthorizeManager')).toBe(false);
  });

  it('should identify manager role', () => {
    expect(SiteRole.isDepartmentManagerRole(AuthorizeRoleEnum.AuthorizeManager)).toBe(true);
    expect(SiteRole.isDepartmentManagerRole(AuthorizeRoleEnum.AuthorizeDepartmentAdmin)).toBe(false);
    expect(SiteRole.isDepartmentManagerRole('AuthorizeManager')).toBe(true);
    expect(SiteRole.isDepartmentManagerRole('AuthorizeDepartmentAdmin')).toBe(false);
  });

  it('should map display names correctly', () => {
    expect(SiteRole.RoleDisplayName[AuthorizeRoleEnum.AuthorizeGeneralAdmin]).toBe('General Admin');
    expect(SiteRole.RoleDisplayName[AuthorizeRoleEnum.AuthorizeActingAdmin]).toBe('Acting Admin');
  });

  it('should return admin roles and names', () => {
    expect(SiteRole.AdminRoles).toContain(AuthorizeRoleEnum.AuthorizeActingAdmin);
    expect(SiteRole.AdminRoleNames).toContain('AuthorizeActingAdmin');
  });

  it('should return correct role name from enum', () => {
    expect(SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager)).toBe('AuthorizeManager');
  });

  it('should handle DefaultRole constant', () => {
    expect(SiteRole.DefaultRole).toBe('Default');
  });

  // Negative cases for coverage
  it('should return false for isAdministrativeRole with invalid string', () => {
    expect(SiteRole.isAdministrativeRole('random')).toBe(false);
  });

  it('should return false for isDepartmentAdminRole with invalid string', () => {
    expect(SiteRole.isDepartmentAdminRole('random')).toBe(false);
  });

  it('should return false for isDepartmentManagerRole with invalid string', () => {
    expect(SiteRole.isDepartmentManagerRole('random')).toBe(false);
  });
});
