import { describe, it, expect } from 'vitest';
import { UserManager1 } from '../../src/policy/user.manager.1.js';
import { SiteClaim, AuthorizeClaimEnum, AuthorizeClaimTypeEnum, Claim } from '../../src/claims/index.js';
import { SiteManager } from '../../src/policy/site.manager.js';
import { IdentityResult } from '../../src/types/index.js';

// Mock repository implementing IUserRepository
class MockRepo {
  async findById(id: string) { return null; }
  async getClaims(user: any): Promise<Claim[]> { return user?.claims; }
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

describe('UserManager extra branches', () => {
  const repo = new MockRepo();
  const manager = new UserManager1(repo);

  it('getDepartmentAsync should return null when user is null', async () => {
    const result = await manager.getDepartmentAsync(null as any);
    expect(result).toBeNull();
  });

  it('getPriorityAsync should return 0 when user is null', async () => {
    const result = await manager.getPriorityAsync(null as any, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(0);
  });

  it('getDepartmentAsync should return null when claim value is empty', async () => {
    const type = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    const u = { id: 'x', userName: 'empty', roles: [], claims: [{ type, value: '' }] };
    const result = await manager.getDepartmentAsync(u as any);
    expect(result).toBeNull();
  });

  describe('manager.priorManagerResolve', () => {
    const provider = AuthorizeClaimEnum.DepartmentUser;
    const claimType = SiteManager.priorManagerClaimType(provider);

    const makeUser = (id: string, priority: number): any => ({
      id,
      userName: `u${id}`,
      roles: [],
      claims: [{ type: claimType, value: String(priority) }],
    });

    it('should classify user into A group', async () => {
      const u = makeUser('A', SiteManager.priorManagerClaimValue(100));
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.A).toContain(u);
      expect(result.Z).toContain(u);
    });

    it('should classify user into B group', async () => {
      const u = makeUser('B', SiteManager.priorManagerClaimValue(80));
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.B).toContain(u);
      expect(result.Z).toContain(u);
    });

    it('should classify user into C group', async () => {
      const u = makeUser('C', SiteManager.priorManagerClaimValue(70));
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.C).toContain(u);
      expect(result.Z).toContain(u);
    });

    it('should classify user into D group', async () => {
      const u = makeUser('D', SiteManager.priorManagerClaimValue(60));
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.D).toContain(u);
      expect(result.Z).toContain(u);
    });

    it('should classify user into E group', async () => {
      const u = makeUser('E', SiteManager.priorManagerClaimValue(50));
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.E).toContain(u);
      expect(result.Z).toContain(u);
    });

    it('should put user only in Z when no priority claim', async () => {
      const u = { id: 'Z', userName: 'zUser', roles: [], claims: [] };
      const result = await manager.priorManagerResolve(provider, [u]);
      expect(result.Z).toContain(u);
      expect(result.A.length + result.B.length + result.C.length + result.D.length + result.E.length).toBe(0);
    });

    it('should handle multiple users across groups', async () => {
      const uA = makeUser('A', SiteManager.priorManagerClaimValue(100));
      const uB = makeUser('B', SiteManager.priorManagerClaimValue(80));
      const uC = makeUser('C', SiteManager.priorManagerClaimValue(70));
      const result = await manager.priorManagerResolve(provider, [uA, uB, uC]);
      expect(result.A).toContain(uA);
      expect(result.B).toContain(uB);
      expect(result.C).toContain(uC);
      expect(result.Z).toEqual(expect.arrayContaining([uA, uB, uC]));
    });
  });
});
