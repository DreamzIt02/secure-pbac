import { describe, it, expect } from 'vitest';
import { PolicyAuthorizeService } from '../../src/services/index.js';
import { PolicyEnum } from '../../src/policies/index.js';
import { AuthorizeRoleEnum, SiteRole } from '../../src/roles/index.js';
import { SiteClaim, AuthorizeClaimEnum, Claim } from '../../src/claims/index.js';

const svc = new PolicyAuthorizeService();

function makeUser(roles: AuthorizeRoleEnum[] = [], claims: Claim[] = []) {
  return { id: 'u', userName: 'user', roles, claims };
}

describe('PolicyAuthorizeService security tests', () => {
  // authorizeAsync
  it('should succeed via default admin when checkDefault is true', async () => {
    const user = makeUser([AuthorizeRoleEnum.Default]);
    const result = await svc.authorizeAsync(user, [PolicyEnum.SiteAdmin], true);
    expect(result.succeeded).toBe(true);
  });

  it('should fail authorizeAsync when no policies succeed', async () => {
    const user = makeUser([]);
    const result = await svc.authorizeAsync(user, [PolicyEnum.SiteAdmin], false);
    expect(result.succeeded).toBe(false);
  });

  it('should succeed authorizeAsync via non-SiteAdmin policy claim', async () => {
    const user = makeUser([], [{ type: 'Policy', value: PolicyEnum[PolicyEnum.SiteGeneralAdmin] }]);
    const result = await svc.authorizeAsync(user, [PolicyEnum.SiteGeneralAdmin], false);
    expect(result.succeeded).toBe(true);
  });

  // authorizePolicy
  it('should succeed authorizePolicy when claim matches policy', async () => {
    const user = makeUser([], [{ type: 'Policy', value: PolicyEnum[PolicyEnum.SiteGeneralAdmin] }]);
    const result = await svc.authorizePolicy(user, PolicyEnum.SiteGeneralAdmin);
    expect(result.succeeded).toBe(true);
  });

  it('should fail authorizePolicy when claim does not match', async () => {
    const user = makeUser([], [{ type: 'Policy', value: 'WRONG' }]);
    const result = await svc.authorizePolicy(user, PolicyEnum.SiteGeneralAdmin);
    expect(result.succeeded).toBe(false);
  });

  // isDefaultAdmin / isActingAdmin / isGeneralAdmin
  it('should detect default admin role', async () => {
    const user = makeUser([AuthorizeRoleEnum.Default]);
    const result = await svc.isDefaultAdmin(user);
    expect(result.succeeded).toBe(true);
  });

  it('should detect acting admin role', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeActingAdmin]);
    const result = await svc.isActingAdmin(user);
    expect(result.succeeded).toBe(true);
  });

  it('should detect general admin role', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeGeneralAdmin]);
    const result = await svc.isGeneralAdmin(user);
    expect(result.succeeded).toBe(true);
  });

  // isDepartmentAdmin
  it('should succeed department admin without claim check', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeDepartmentAdmin]);
    const result = await svc.isDepartmentAdmin(user);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed department admin with matching claim', async () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!;
    const user = makeUser([AuthorizeRoleEnum.AuthorizeDepartmentAdmin], [claim]);
    const result = await svc.isDepartmentAdmin(user, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(true);
  });

  it('should fail department admin with non-matching claim', async () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!;
    const user = makeUser([AuthorizeRoleEnum.AuthorizeDepartmentAdmin], [{ type: claim.type, value: 'WRONG' }]);
    const result = await svc.isDepartmentAdmin(user, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  // isDepartmentManager
  it('should succeed department manager without claim check', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeManager]);
    const result = await svc.isDepartmentManager(user);
    expect(result.succeeded).toBe(true);
  });

  it('should succeed department manager with matching claim', async () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!;
    const user = makeUser([AuthorizeRoleEnum.AuthorizeManager], [claim]);
    const result = await svc.isDepartmentManager(user, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(true);
  });

  it('should fail department manager with non-matching claim', async () => {
    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!;
    const user = makeUser([AuthorizeRoleEnum.AuthorizeManager], [{ type: claim.type, value: 'WRONG' }]);
    const result = await svc.isDepartmentManager(user, AuthorizeClaimEnum.DepartmentUser);
    expect(result.succeeded).toBe(false);
  });

  // isInAdminGroup
  it('should return true when user is in admin group', async () => {
    const user = makeUser([SiteRole.AdminRoles[0]]);
    const result = await svc.isInAdminGroup(user);
    expect(result).toBe(true);
  });

  it('should return false when user is not in admin group', async () => {
    const user = makeUser([]);
    const result = await svc.isInAdminGroup(user);
    expect(result).toBe(false);
  });

  // forbiddenAdminGroup
  it('should return true when user is any admin', async () => {
    const user = makeUser([AuthorizeRoleEnum.Default]);
    const result = await svc.forbiddenAdminGroup(user);
    expect(result).toBe(true);
  });

  it('should return false when user has no admin roles', async () => {
    const user = makeUser([]);
    const result = await svc.forbiddenAdminGroup(user);
    expect(result).toBe(false);
  });

  // authorizeAdminGroup
  it('should authorize default admin', async () => {
    const user = makeUser([AuthorizeRoleEnum.Default]);
    const result = await svc.authorizeAdminGroup(user);
    expect(result).toBe(true);
  });

  it('should authorize acting admin', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeActingAdmin]);
    const result = await svc.authorizeAdminGroup(user);
    expect(result).toBe(true);
  });

  it('should authorize department admin', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeDepartmentAdmin]);
    const result = await svc.authorizeAdminGroup(user);
    expect(result).toBe(true);
  });

  it('should fail authorizeAdminGroup when no admin roles', async () => {
    const user = makeUser([]);
    const result = await svc.authorizeAdminGroup(user);
    expect(result).toBe(false);
  });

  // authorizeManagerGroup
  it('should authorize manager group when role present', async () => {
    const user = makeUser([AuthorizeRoleEnum.AuthorizeManager]);
    const result = await svc.authorizeManagerGroup(user);
    expect(result).toBe(true);
  });

  it('should fail authorizeManagerGroup when role missing', async () => {
    const user = makeUser([]);
    const result = await svc.authorizeManagerGroup(user);
    expect(result).toBe(false);
  });
});
