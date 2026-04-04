import { describe, expect, it, vi } from 'vitest';
import { policyAuthorize } from '../../src/filters/index.js';
import { PolicyEnum } from '../../src/policies/index.js';

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

describe('policyAuthorize filter', () => {
  it('should return 401 when user is missing', async () => {
    const res = mockResponse();
    await policyAuthorize([PolicyEnum.SiteAdmin])({ user: undefined } as any, res as any);
    expect(res.statusCode).toBe(401);
    expect(res.body).toContain('Unauthorized');
  });

  it('should forbid when user lacks required policy', async () => {
    const res = mockResponse();
    const req = { user: { roles: [], claims: [] } };
    await policyAuthorize([PolicyEnum.SiteGeneralAdmin])(req as any, res as any);
    expect(res.statusCode).toBe(403);
    expect(res.body).toContain('Forbidden');
  });

  it('should call next when user has required policy', async () => {
    const res = mockResponse();
    const next = vi.fn(); // ✅ replaced

    const req = {
      user: {
        roles: [1],
        claims: [{ type: 'Policy', value: 'SiteActingAdmin' }],
      },
    };

    await policyAuthorize([PolicyEnum.SiteActingAdmin])(
      req as any,
      res as any,
      next
    );

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1); // 🔥 recommended
  });

  it('should succeed with checkDefault true when user is default admin', async () => {
    const res = mockResponse();
    const next = vi.fn(); // ✅ replaced

    const req = {
      user: {
        roles: [0], // Default admin role
        claims: [],
      },
    };

    await policyAuthorize([PolicyEnum.SiteGeneralAdmin], true)(
      req as any,
      res as any,
      next
    );

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1); // 🔥 recommended
  });

  it('should NOT call next when policy is missing', async () => {
    const res = mockResponse();
    const next = vi.fn();

    const req = {
      user: {
        roles: [1],
        claims: [],
      },
    };

    await policyAuthorize([PolicyEnum.SiteActingAdmin])(
      req as any,
      res as any,
      next
    );

    expect(next).not.toHaveBeenCalled(); // 🔥 critical test
  });

  it('should forbid when checkDefault true but user is not default admin', async () => {
    const res = mockResponse();
    const req = { user: { roles: [], claims: [] } };
    await policyAuthorize([PolicyEnum.SiteGeneralAdmin], true)(req as any, res as any);
    expect(res.statusCode).toBe(403);
  });

  it('should succeed without next when user has required policy', async () => {
    const res = mockResponse();
    const req = { user: { roles: [1], claims: [{ type: 'Policy', value: 'SiteActingAdmin' }] } };
    await policyAuthorize([PolicyEnum.SiteActingAdmin])(req as any, res as any);
    expect(res.statusCode).toBe(0); // no forbidden set
  });
});
