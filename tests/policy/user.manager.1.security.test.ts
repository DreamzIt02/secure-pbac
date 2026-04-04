import { describe, it, expect } from 'vitest';
import { UserManager1 } from '../../src/policy/user.manager.1.js';
import { SiteClaim, AuthorizeClaimEnum, Claim } from '../../src/claims/index.js';
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

describe('UserManager security tests', () => {
  const repo = new MockRepo();
  const manager = new UserManager1(repo);

  // 1. Role/claim bypass attempt: user has wrong claim type
  it('should reject sign-in bypass with wrong claim type', async () => {
    const dbUser = {
      id: 'sec1',
      userName: 'badUser',
      roles: [],
      claims: [{ type: 'FakeClaim', value: 'FakeValue' }],
    };
    const sessionClaims: Claim[] = [{ type: 'FakeClaim', value: 'FakeValue' }];
    const result = await manager.hasSignInClaimAsync(sessionClaims, dbUser as any);
    expect(result).toBe(false);
  });

  // 2. Claim tampering: correct type but wrong value
  it('should reject sign-in bypass with tampered claim value', async () => {
    const dbUser = {
      id: 'sec2',
      userName: 'tamperedUser',
      roles: [],
      claims: [SiteClaim.newSignInClaim()],
    };
    const sessionClaims: Claim[] = [{ type: SiteClaim.SignInClaimType, value: 'WRONG' }];
    const result = await manager.hasSignInClaimAsync(sessionClaims, dbUser as any);
    expect(result).toBe(false);
  });

  // 3. Invalid session: null user in hasClaimAsync
  it('should return false for hasClaimAsync when user is null (invalid session)', async () => {
    const result = await manager.hasClaimAsync(null as any, { type: 'x', value: 'y' });
    expect(result).toBe(false);
  });

  // 4. Invalid session: null user in getPriorityAsync
  it('should return 0 priority for null user (invalid session)', async () => {
    const result = await manager.getPriorityAsync(null as any, AuthorizeClaimEnum.DepartmentUser);
    expect(result).toBe(0);
  });

  // 5. PriorManagerResolve with mixed claims (security grouping)
  it('should classify users correctly and always add to Z', async () => {
    const provider = AuthorizeClaimEnum.DepartmentUser;
    const claimType = SiteManager.priorManagerClaimType(provider);

    const uA = { id: 'A', userName: 'uA', roles: [], claims: [{ type: claimType, value: String(SiteManager.priorManagerClaimValue(100)) }] };
    const uBad = { id: 'Bad', userName: 'uBad', roles: [], claims: [{ type: claimType, value: 'INVALID' }] };

    const result = await manager.priorManagerResolve(provider, [uA, uBad]);

    expect(result.A).toContain(uA);
    expect(result.Z).toContain(uA);
    expect(result.Z).toContain(uBad);
    expect(result.A).not.toContain(uBad); // bypass attempt fails
  });

  // Extra: ensure PriorManagerResolve handles multiple groups
  it('should classify users into B, C, D, E groups correctly', async () => {
    const provider = AuthorizeClaimEnum.DepartmentUser;
    const claimType = SiteManager.priorManagerClaimType(provider);

    const uB = { id: 'B', userName: 'uB', roles: [], claims: [{ type: claimType, value: String(SiteManager.priorManagerClaimValue(80)) }] };
    const uC = { id: 'C', userName: 'uC', roles: [], claims: [{ type: claimType, value: String(SiteManager.priorManagerClaimValue(70)) }] };
    const uD = { id: 'D', userName: 'uD', roles: [], claims: [{ type: claimType, value: String(SiteManager.priorManagerClaimValue(60)) }] };
    const uE = { id: 'E', userName: 'uE', roles: [], claims: [{ type: claimType, value: String(SiteManager.priorManagerClaimValue(50)) }] };

    const result = await manager.priorManagerResolve(provider, [uB, uC, uD, uE]);

    expect(result.B).toContain(uB);
    expect(result.C).toContain(uC);
    expect(result.D).toContain(uD);
    expect(result.E).toContain(uE);
    // All should also be in Z
    expect(result.Z).toEqual(expect.arrayContaining([uB, uC, uD, uE]));
  });
});
