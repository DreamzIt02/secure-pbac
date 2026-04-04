import { PolicyAuthorizeService } from '../../src/services/index.js';
import { AuthorizeRoleEnum } from '../../src/roles/index.js';
import { PolicyEnum } from '../../src/policies/index.js';
import { AuthorizeClaimEnum, SiteClaim } from '../../src/claims/index.js';
import { describe, it, expect } from 'vitest';

describe('PolicyAuthorizeService', () => {
  const service = new PolicyAuthorizeService();

  const defaultAdminUser = {
    id: '1',
    userName: 'defaultAdmin',
    roles: [AuthorizeRoleEnum.Default],
    claims: [],
  };

  const generalAdminUser = {
    id: '2',
    userName: 'generalAdmin',
    roles: [AuthorizeRoleEnum.AuthorizeGeneralAdmin],
    claims: [],
  };

  const deptAdminUser = {
    id: '3',
    userName: 'deptAdmin',
    roles: [AuthorizeRoleEnum.AuthorizeDepartmentAdmin],
    claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!],
  };

  const deptAdminUserWrongClaim = {
    id: '6',
    userName: 'deptAdminWrong',
    roles: [AuthorizeRoleEnum.AuthorizeDepartmentAdmin],
    claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentFinance)!],
  };

  const managerUser = {
    id: '4',
    userName: 'manager',
    roles: [AuthorizeRoleEnum.AuthorizeManager],
    claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!],
  };

  const managerUserWrongClaim = {
    id: '7',
    userName: 'managerWrong',
    roles: [AuthorizeRoleEnum.AuthorizeManager],
    claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentFinance)!],
  };

  const actingAdminUser = {
    id: '8',
    userName: 'actingAdmin',
    roles: [AuthorizeRoleEnum.AuthorizeActingAdmin],
    claims: [{ type: 'Policy', value: 'siteactingadmin' }],
  };

  const nonAdminUser = {
    id: '9',
    userName: 'regularUser',
    roles: [],
    claims: [],
  };

  it('should authorize ActingAdmin role', async () => {
    const result = await service.isActingAdmin(actingAdminUser);
    expect(result.succeeded).toBe(true);
  });

  it('should forbid admin group when user is ActingAdmin', async () => {
    const result = await service.forbiddenAdminGroup(actingAdminUser);
    expect(result).toBe(true);
  });

  it('should authorize admin group when user is ActingAdmin', async () => {
    const result = await service.authorizeAdminGroup(actingAdminUser);
    expect(result).toBe(true);
  });

  it('should not authorize DefaultAdmin for ActingAdmin user', async () => {
    const result = await service.isDefaultAdmin(actingAdminUser);
    expect(result.succeeded).toBe(false);
  });

  it('should authorize policy claim', async () => {
    const result = await service.authorizePolicy(actingAdminUser, PolicyEnum.SiteActingAdmin);
    expect(result.succeeded).toBe(true);
  });

  it('should fail department manager check if no role', async () => {
    const result = await service.isDepartmentManager(nonAdminUser, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  it('should authorize default admin when checkDefault is true', async () => {
    const result = await service.authorizeAsync(defaultAdminUser, [PolicyEnum.SiteGeneralAdmin], true);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed for general admin role', async () => {
    const result = await service.isGeneralAdmin(generalAdminUser);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed for department admin with matching claim', async () => {
    const result = await service.isDepartmentAdmin(deptAdminUser, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed for department manager with matching claim', async () => {
    const result = await service.isDepartmentManager(managerUser, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(true);
  });

  it('should fail authorizeAsync with checkDefault true for non-admin user', async () => {
    const result = await service.authorizeAsync(nonAdminUser, [PolicyEnum.SiteGeneralAdmin], true);
    expect(result.succeeded).toBe(false);
  });

  it('should fail department admin check when claim does not match', async () => {
    const result = await service.isDepartmentAdmin(deptAdminUserWrongClaim, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  it('should fail department manager check when claim does not match', async () => {
    const result = await service.isDepartmentManager(managerUserWrongClaim, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  it('should fail department admin when role is missing even if claim matches', async () => {
    const userWithoutRole = {
      id: '10',
      userName: 'noRoleDeptAdmin',
      roles: [],
      claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!],
    };
    const result = await service.isDepartmentAdmin(userWithoutRole, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  it('should fail department manager when role is missing even if claim matches', async () => {
    const userWithoutRole = {
      id: '11',
      userName: 'noRoleManager',
      roles: [],
      claims: [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!],
    };
    const result = await service.isDepartmentManager(userWithoutRole, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  // 🔹 Additional coverage

  it('should identify user in admin group', async () => {
    const result = await service.isInAdminGroup(generalAdminUser);
    expect(result).toBe(true);
  });

  it('should not identify non-admin user in admin group', async () => {
    const result = await service.isInAdminGroup(nonAdminUser);
    expect(result).toBe(false);
  });

  it('should authorize manager group when user is manager', async () => {
    const result = await service.authorizeManagerGroup(managerUser);
    expect(result).toBe(true);
  });

  it('should not authorize manager group when user is not manager', async () => {
    const result = await service.authorizeManagerGroup(nonAdminUser);
    expect(result).toBe(false);
  });
  
  it('should fail department admin when expectedClaim is null', async () => {
    const user = { id: 'x', userName: 'u', roles: [AuthorizeRoleEnum.AuthorizeDepartmentAdmin], claims: [] };
    const result = await service.isDepartmentAdmin(user, undefined);
    expect(result.succeeded).toBe(true); // role only, no claim required
  });

  it('should fail department manager when expectedClaim is null', async () => {
    const user = { id: 'y', userName: 'u', roles: [AuthorizeRoleEnum.AuthorizeManager], claims: [] };
    const result = await service.isDepartmentManager(user, undefined);
    expect(result.succeeded).toBe(true);
  });

});
