import { describe, it, expect } from 'vitest';
import { UserManager1 } from '../../src/policy/user.manager.1.js';
import { SiteClaim, AuthorizeClaimEnum, AuthorizeClaimTypeEnum, Claim } from '../../src/claims/index.js';
import { IUser } from '../../src/types/index.js';
import { AuthorizeRoleEnum } from '../../src/roles/index.js';
import { SiteManager } from '../../src/policy/site.manager.js';
import { IdentityResult } from '../../src/types/index.js';

// Mock repository implementing IUserRepository
class MockRepo {
  async findById(id: string) { return null; }
  async getClaims(user: any): Promise<Claim[]> { return user.claims; }
  async addClaim(user: any, claim: Claim): Promise<IdentityResult> {
    user.claims.push(claim);
    return { succeeded: true };
  }
  async replaceClaim(user: any, oldClaim: Claim, newClaim: Claim): Promise<IdentityResult> {
    const idx = user.claims.indexOf(oldClaim);
    if (idx >= 0) user.claims[idx] = newClaim;
    return { succeeded: true };
  }
}

describe('UserManager', () => {
  const repo = new MockRepo();
  const manager = new UserManager1(repo);

  const user = {
    id: '1',
    userName: 'testUser',
    roles: [],
    claims: [SiteClaim.newSignInClaim()],
  };

  it('should detect existing claim', async () => {
    const claim = user.claims[0];
    const result = await manager.hasClaimAsync(user as any, claim);
    expect(result).toBe(true);
  });

  it('should return false for missing claim', async () => {
    const result = await manager.hasClaimAsync(user as any, { type: 'x', value: 'y' });
    expect(result).toBe(false);
  });

  it('should succeed hasSignInClaimAsync when claim exists', async () => {
    const sessionClaims = [...user.claims];
    const result = await manager.hasSignInClaimAsync(sessionClaims, user as any);
    expect(result).toBe(true);
  });

  it('should allow anonymous when dbUser is null', async () => {
    const result = await manager.hasSignInClaimAsync([], null as any);
    expect(result).toBe(true);
  });

  it('should return false when dbUser has claim but session does not', async () => {
    const dbUser = { id: 'x', userName: 'db', roles: [], claims: [SiteClaim.newSignInClaim()] };
    const sessionClaims: Claim[] = [];
    const result = await manager.hasSignInClaimAsync(sessionClaims, dbUser as any);
    expect(result).toBe(false);
  });

  it('should return false when session has fake claim not matching dbUser', async () => {
    const dbUser = { id: 'y', userName: 'db', roles: [], claims: [SiteClaim.newSignInClaim()] };
    const sessionClaims: Claim[] = [{ type: SiteClaim.SignInClaimType, value: 'WRONG' }];
    const result = await manager.hasSignInClaimAsync(sessionClaims, dbUser as any);
    expect(result).toBe(false);
  });

  it('should add sign-in claim when missing', async () => {
    const u = { id: '2', userName: 'u2', roles: [], claims: [] };
    const result = await manager.addSignInClaimAsync(u as any);
    expect(result.succeeded).toBe(true);
    expect(u.claims.length).toBe(1);
  });

  it('should fail addSignInClaimAsync when user is null', async () => {
    const result = await manager.addSignInClaimAsync(null as any);
    expect(result.succeeded).toBe(false);
  });

  it('should update sign-in claim when exists', async () => {
    const u = { id: '3', userName: 'u3', roles: [], claims: [SiteClaim.newSignInClaim()] };
    const result = await manager.updateSignInClaimAsync(u as any);
    expect(result.succeeded).toBe(true);
    expect(u.claims.length).toBe(1);
  });

  it('should add sign-in claim when none exists', async () => {
    const u = { id: '4', userName: 'u4', roles: [], claims: [] };
    const result = await manager.updateSignInClaimAsync(u as any);
    expect(result.succeeded).toBe(true);
    expect(u.claims.length).toBe(1);
  });

  it('should fail updateSignInClaimAsync when user is null', async () => {
    const result = await manager.updateSignInClaimAsync(null as any);
    expect(result.succeeded).toBe(false);
  });

  it('should return null for department when claim missing', async () => {
    const result = await manager.getDepartmentAsync(user as any);
    expect(result).toBeNull();
  });

  it('should return priority when claim exists', async () => {
    const claim = SiteManager.priorityClaim(AuthorizeClaimEnum.DepartmentUser, 80);
    const u = { id: '5', userName: 'u5', roles: [], claims: [claim] };
    const result = await manager.getPriorityAsync(u as any, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(80);
  });

  it('should return 0 priority when claim missing', async () => {
    const u = { id: '6', userName: 'u6', roles: [], claims: [] };
    const result = await manager.getPriorityAsync(u as any, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(0);
  });

  it('should return false when user is null in hasClaimAsync', async () => {
    const result = await manager.hasClaimAsync(null as any, { type: 'x', value: 'y' });
    expect(result).toBe(false);
  });

  it('should return false when sign-in claim is missing', async () => {
    const u = { id: '7', userName: 'u7', roles: [], claims: [] };
    const result = await manager.hasSignInClaimAsync([], u as any);
    expect(result).toBe(false);
  });

  it('should NOT duplicate sign-in claim', async () => {
    const u = { id: '8', userName: 'u8', roles: [], claims: [SiteClaim.newSignInClaim()] };
    await manager.addSignInClaimAsync(u as any);
    expect(u.claims.length).toBe(1);
  });

  it('should replace existing sign-in claim (not duplicate)', async () => {
    const original = SiteClaim.newSignInClaim();
    const u = { id: '9', userName: 'u9', roles: [], claims: [original] };
    await manager.updateSignInClaimAsync(u as any);
    expect(u.claims.length).toBe(1);
    expect(u.claims[0]).not.toBe(original);
  });

  it('should return department when claim exists', async () => {
    const type = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    const value = AuthorizeClaimEnum.DepartmentUser.toString();
    const u: IUser<AuthorizeRoleEnum, Claim> = { id: '10', userName: 'u10', roles: [], claims: [{ type, value }] };
    const result = await manager.getDepartmentAsync(u as any);
    expect(result).toBe(AuthorizeClaimEnum.DepartmentUser);
  });

  it('should return null for invalid department value', async () => {
    const type = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    const u = { id: '11', userName: 'u11', roles: [], claims: [{ type, value: 'INVALID' }] };
    const result = await manager.getDepartmentAsync(u as any);
    expect(result).toBeNull();
  });

  it('should return 0 when priority is invalid number', async () => {
    const u = { id: '12', userName: 'u12', roles: [], claims: [{ type: 'Priority', value: 'abc' }] };
    const result = await manager.getPriorityAsync(u as any, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(0);
  });
});
