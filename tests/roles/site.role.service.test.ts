import { AuthorizeRoleEnum, RoleValidationService, SiteRole } from '../../src/roles/index.js';
import { describe, expect, it } from 'vitest';

describe('RoleValidationService', () => {
  const mockGetUsersInRole = async (roleName: string) => {
    if (roleName === 'authorizeactingadmin') return ['existingUser'];
    return [];
  };

  it('should forbid adding to Default role', async () => {
    const result = await RoleValidationService.validateAddToRoleAsync(
      AuthorizeRoleEnum.Default,
      mockGetUsersInRole,
      'testUser'
    );
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Forbidden');
  });

  it('should allow adding GeneralAdmin if no users exist', async () => {
    const result = await RoleValidationService.validateAddToRoleAsync(
      AuthorizeRoleEnum.AuthorizeGeneralAdmin,
      async () => [],
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should forbid adding ActingAdmin if a user already exists', async () => {
    const result = await RoleValidationService.validateAddToRoleAsync(
      AuthorizeRoleEnum.AuthorizeActingAdmin,
      mockGetUsersInRole,
      'testUser'
    );
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Max');
  });

  it('should allow adding DepartmentAdmin', async () => {
    const result = await RoleValidationService.validateAddToRoleAsync(
      AuthorizeRoleEnum.AuthorizeDepartmentAdmin,
      mockGetUsersInRole,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should allow adding Manager', async () => {
    const result = await RoleValidationService.validateAddToRoleAsync(
      AuthorizeRoleEnum.AuthorizeManager,
      mockGetUsersInRole,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should forbid removing Default role', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(
      AuthorizeRoleEnum.Default,
      'testUser'
    );
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Forbidden');
  });

  it('should allow removing ActingAdmin', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(
      AuthorizeRoleEnum.AuthorizeActingAdmin,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  // 🔹 Additional coverage

  it('should allow removing GeneralAdmin', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(
      AuthorizeRoleEnum.AuthorizeGeneralAdmin,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should allow removing DepartmentAdmin', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(
      AuthorizeRoleEnum.AuthorizeDepartmentAdmin,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should allow removing Manager', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(
      AuthorizeRoleEnum.AuthorizeManager,
      'testUser'
    );
    expect(result.succeeded).toBe(true);
  });

  it('should normalize role names using SiteRole helper', async () => {
    const roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager);
    expect(roleName).toBe('AuthorizeManager');
  });

  it('should forbid removing Default role', async () => {
    const result = await RoleValidationService.validateRemoveFromRoleAsync(AuthorizeRoleEnum.Default, 'testUser');
    expect(result.succeeded).toBe(false);
    expect(result.errors?.[0].code).toBe('Forbidden');
  });
  
});
