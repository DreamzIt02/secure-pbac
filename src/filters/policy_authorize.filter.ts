import { HttpRequest, HttpResponse, AuthUser } from '../types/http.js';
import { PolicyAuthorizeService } from '../services/policy_authorize.service.js';
import { PolicyEnum } from '../policies/index.js';

const policyService = new PolicyAuthorizeService();

/**
 * Middleware to authorize based on policies.
 * @param requiredPolicies - list of required PolicyEnum values
 * @param checkDefault - whether to check default admin first
 */
export function policyAuthorize(requiredPolicies: PolicyEnum[], checkDefault = false) {
  return async (req: HttpRequest, res: HttpResponse, next?: () => void) => {
    const user: AuthUser | undefined = req.user;
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Unauthorized' }));
      return;
    }

    const result = await policyService.authorizeAsync(user, requiredPolicies, checkDefault);
    if (result.succeeded) {
      if (next) return next();
      return;
    }

    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Forbidden: insufficient policy authorization' }));
  };
}
