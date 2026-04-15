import { SiteManager, PriorManagers } from '../../src/policy/index.js';
import { AuthorizeClaimEnum, AuthorizeClaimPriorityEnum, SiteClaim } from '../../src/claims/index.js';
import { describe, it, beforeEach, expect } from 'vitest';

describe('SiteManager', () => {
  it('should generate priorManagerClaimType correctly', () => {
    const type = SiteManager.priorManagerClaimType(AuthorizeClaimEnum.DepartmentUser);
    expect(type).toBe(`preferred_${SiteClaim.authorizeClaimName(AuthorizeClaimEnum.DepartmentUser)}`);
  });

  it('should generate priorManagerClaimValue correctly', () => {
    expect(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.A)).toBe(100);
  });

  it('should generate log messages with and without name', () => {
    expect(SiteManager.priorManagerLog('admin')).toContain("Admin user 'admin' signed in");
    expect(SiteManager.priorManagerLog('admin', 'Dept')).toContain("of 'Dept'");
    expect(SiteManager.priorManagerResetLog('admin')).toContain("signed out");
  });

  it('should create priority claim with value', () => {
    const claim = SiteManager.priorityClaim(AuthorizeClaimEnum.DepartmentUser, AuthorizeClaimPriorityEnum.B);
    expect(claim.type).toContain('preferred_');
    expect(claim.value).toBe(String(AuthorizeClaimPriorityEnum.B));
  });

  it('should create priority claim with empty value when null', () => {
    const claim = SiteManager.priorityClaim(AuthorizeClaimEnum.DepartmentUser, null);
    expect(claim.value).toBe('');
  });

  describe('select logic', () => {
    let managers: PriorManagers<string, any>;
    beforeEach(() => {
      managers = new PriorManagers();
      managers.A.push({ id: '1', userName: 'A1', roles: [], claims: [] });
      managers.B.push({ id: '2', userName: 'B1', roles: [], claims: [] });
      managers.C.push({ id: '3', userName: 'C1', roles: [], claims: [] });
      managers.D.push({ id: '4', userName: 'D1', roles: [], claims: [] });
      managers.E.push({ id: '5', userName: 'E1', roles: [], claims: [] });
      managers.Z.push({ id: '6', userName: 'Z1', roles: [], claims: [] });
    });

    it('should select from A group first', () => {
      const [selected, fallback] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('A1');
      expect(fallback).toBe(false);
    });

    it('should select from B group when A empty', () => {
      managers.A = [];
      const [selected] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('B1');
    });

    it('should select from C group when A and B empty', () => {
      managers.A = [];
      managers.B = [];
      const [selected] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('C1');
    });

    it('should select from D group when A–C empty', () => {
      managers.A = [];
      managers.B = [];
      managers.C = [];
      const [selected] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('D1');
    });

    it('should select from E group when A–D empty', () => {
      managers.A = [];
      managers.B = [];
      managers.C = [];
      managers.D = [];
      const [selected] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('E1');
    });

    it('should fallback to Z group when all others empty', () => {
      managers.A = [];
      managers.B = [];
      managers.C = [];
      managers.D = [];
      managers.E = [];
      const [selected, fallback] = SiteManager.select(managers, 10, 0);
      expect(selected.userName).toBe('Z1');
      expect(fallback).toBe(true);
    });

    it('should throw error when no managers available', () => {
      managers.A = [];
      managers.B = [];
      managers.C = [];
      managers.D = [];
      managers.E = [];
      managers.Z = [];
      expect(() => SiteManager.select(managers, 10, 0)).toThrow('No managers available');
    });
  });
});
