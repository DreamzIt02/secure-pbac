import { PolicyEnum, GroupPolicy } from '../policies/index.js';
import { Claim } from '../claims/index.js';
import { IdentityResult } from '../types/index.js';

export class PolicyValidationService {
  /**
   * Validate that a user has at least one of the required policies.
   */
  static async validatePoliciesAsync(
    userClaims: Claim[],
    requiredPolicies: PolicyEnum[],
    checkDefault = false
  ): Promise<IdentityResult> {
    if (checkDefault) {
      const defaultClaim = GroupPolicy.requestPolicyClaim(PolicyEnum.SiteAdmin);
      const hasDefault = userClaims.some(
        (c) => c.type === defaultClaim.type && c.value === defaultClaim.value
      );
      if (hasDefault) {
        return { succeeded: true };
      }
    }

    for (const policy of requiredPolicies) {
      const expected = GroupPolicy.requestPolicyClaim(policy);
      const hasClaim = userClaims.some(
        (c) => c.type === expected.type && c.value === expected.value
      );
      if (hasClaim) {
        return { succeeded: true };
      }
    }

    return {
      succeeded: false,
      errors: [
        {
          code: 'Forbidden',
          description: `User lacks required policies: ${requiredPolicies.map((p) => PolicyEnum[p]).join(', ')}`,
        },
      ],
    };
  }

  /**
   * Validate a single policy.
   */
  static async validatePolicyAsync(userClaims: Claim[], policy: PolicyEnum): Promise<IdentityResult> {
    const expected = GroupPolicy.requestPolicyClaim(policy);
    const hasClaim = userClaims.some(
      (c) => c.type === expected.type && c.value === expected.value
    );
    return hasClaim ? { succeeded: true } : { succeeded: false, errors: [{ code: 'Forbidden', description: `Missing ${PolicyEnum[policy]}` }] };
  }
}
