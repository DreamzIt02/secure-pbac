import { HttpRequest, HttpResponse, AuthUser } from '../types/http.js';
import { AuthorizeClaimEnum, SiteClaim } from '../claims/index.js';

/**
 * Middleware to authorize based on claims.
 * @param requiredClaims - list of required AuthorizeClaimEnum values
 * @param matchCount - minimum number of claims that must match
 */
export function claimAuthorize(requiredClaims: AuthorizeClaimEnum[], matchCount = 1) {
  return async (req: HttpRequest, res: HttpResponse, next?: () => void) => {
    const user: AuthUser | undefined = req.user;
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Unauthorized' }));
      return;
    }

    let count = 0;
    const expectedClaims = SiteClaim.newClaimList(requiredClaims);

    for (const expected of expectedClaims) {
      if (
        user.claims?.some(
          c => SiteClaim.isTypeEqual(c.type, expected.type) && SiteClaim.isValueEqual(c.value, expected.value)
        )
      ) {
        count++;
        if (count >= matchCount) {
          if (next) return next();
          return;
        }
      }
    }

    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Forbidden: insufficient claims' }));
  };
}
