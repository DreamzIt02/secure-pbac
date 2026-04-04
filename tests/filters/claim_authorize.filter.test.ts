import { describe, expect, it, vi } from 'vitest';
import { claimAuthorize } from '../../src/filters/index.js';
import { AuthorizeClaimEnum, SiteClaim } from '../../src/claims/index.js';

function mockResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    end(content: string) {
      this.body = content;
    },
  };
}

describe('claimAuthorize filter', () => {
  it('should return 401 when user is missing', async () => {
    const res = mockResponse();
    await claimAuthorize([AuthorizeClaimEnum.DepartmentUser])({ user: undefined } as any, res as any);
    expect(res.statusCode).toBe(401);
    expect(res.body).toContain('Unauthorized');
  });

  it('should forbid when user lacks required claim', async () => {
    const res = mockResponse();
    const req = { user: { claims: [] } };
    await claimAuthorize([AuthorizeClaimEnum.DepartmentUser])(req as any, res as any);
    expect(res.statusCode).toBe(403);
    expect(res.body).toContain('Forbidden');
  });

  it('should call next when user has required claim', async () => {
    const res = mockResponse();
    const next = vi.fn(); // ✅ replaced

    const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!;
    const req = { user: { claims: [claim] } };

    await claimAuthorize([AuthorizeClaimEnum.DepartmentUser])(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('should succeed when multiple claims match required count', async () => {
    const res = mockResponse();
    const next = vi.fn(); // ✅ replaced

    const claims = [
      SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!,
      SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentContent)!,
    ];

    const req = { user: { claims } };

    await claimAuthorize(
      [AuthorizeClaimEnum.DepartmentUser, AuthorizeClaimEnum.DepartmentContent],
      2
    )(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('should forbid when not enough claims match required count', async () => {
    const res = mockResponse();
    const claims = [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!];
    const req = { user: { claims } };
    await claimAuthorize([AuthorizeClaimEnum.DepartmentUser, AuthorizeClaimEnum.DepartmentContent], 2)(
      req as any,
      res as any
    );
    expect(res.statusCode).toBe(403);
  });
});
