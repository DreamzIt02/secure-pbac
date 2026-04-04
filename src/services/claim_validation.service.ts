import { AuthorizeClaimEnum, SiteClaim } from '../claims/index.js';
import { IdentityResult } from '../types/index.js';

export class ClaimValidationService {
  /**
   * Validate that a user has required claims.
   * @param userClaims - runtime claims attached to the user
   * @param requiredClaims - enum identifiers of required claims
   * @param matchCount - minimum number of claims that must match
   */
  static async validateClaimsAsync(
    userClaims: { type: string; value: string }[],
    requiredClaims: AuthorizeClaimEnum[],
    matchCount = 1
  ): Promise<IdentityResult> {
    if (!requiredClaims || requiredClaims.length === 0) {
      return { succeeded: true };
    }

    const required = SiteClaim.newClaimList(requiredClaims);
    let count = 0;

    for (const req of required) {
      if (
        userClaims.some(
          (c) =>
            SiteClaim.isTypeEqual(c.type, req.type) &&
            SiteClaim.isValueEqual(c.value, req.value)
        )
      ) {
        count++;
        if (count >= matchCount) {
          return { succeeded: true };
        }
      }
    }

    return {
      succeeded: false,
      errors: [
        {
          code: 'Forbidden',
          description: `Insufficient claims: required ${matchCount}, matched ${count}`,
        },
      ],
    };
  }
}
