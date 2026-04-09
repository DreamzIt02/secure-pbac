import { describe, it, expect } from 'vitest';
import { MinimumAgeAuthorize, MinimumAgeRequirement, MinimumAgePolicyProvider, POLICY_PREFIX } from '../../src/dynamic/minimum_age.js';

describe('MinimumAgeAuthorize', () => {
  it('should set and get age correctly', () => {
    const attr = new MinimumAgeAuthorize(21);
    expect(attr.age).toBe(21);
    expect(attr.policy).toBe(`${POLICY_PREFIX}21`);
  });

  it('should return 0 when policy suffix is not a number', () => {
    const attr = new MinimumAgeAuthorize(0);
    // manually override policy to simulate bad input
    (attr as any)._policy = `${POLICY_PREFIX}abc`;
    expect(attr.age).toBe(0);
  });
});

describe('MinimumAgeRequirement', () => {
  it('should store age', () => {
    const req = new MinimumAgeRequirement(18);
    expect(req.age).toBe(18);
  });
});

describe('MinimumAgePolicyProvider', () => {
  const provider = new MinimumAgePolicyProvider();

  it('should return requirement when policy name is valid', () => {
    const policyName = `${POLICY_PREFIX}25`;
    const req = provider.getPolicy(policyName);
    expect(req).toBeInstanceOf(MinimumAgeRequirement);
    expect(req?.age).toBe(25);
  });

  it('should return null when policy name does not start with prefix', () => {
    const req = provider.getPolicy('OtherPolicy');
    expect(req).toBeNull();
  });

  it('should return null when suffix is not a number', () => {
    const req = provider.getPolicy(`${POLICY_PREFIX}abc`);
    expect(req).toBeNull();
  });
});
