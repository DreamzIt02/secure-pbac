// ### 📁 `src/middleware/policy.middleware.ts`

import { PolicyAuthorizeService } from '../services/index.js';
import { PolicyEnum } from '../policies/index.js';
import { HttpRequest, HttpResponse, AuthUser } from '../types/http.js';

const policyService = new PolicyAuthorizeService();

/**
 * Generic middleware factory for PBAC enforcement.
 * Works with raw Node HTTP, Express, Koa, Fastify, NestJS.
 */
export function requirePolicy(requiredPolicies: PolicyEnum[], checkDefault = false) {
  return async (req: HttpRequest, res: HttpResponse, next?: () => void) => {
    const user: AuthUser =
      req.user || { id: 'anonymous', userName: 'anonymous', roles: [], claims: [] };

    const result = await policyService.authorizeAsync(user, requiredPolicies, checkDefault);

    if (result.succeeded) {
      if (next) return next(); // Express/Koa style
      return; // raw HTTP: just continue
    }

    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Forbidden: insufficient policy authorization' }));
  };
}

// ### 📁 Example Usage with Raw Node HTTP

// ```ts
// import { createServer } from 'http';
// import { requirePolicy } from './middleware/policyMiddleware';
// import { PolicyEnum } from './policies';
// import { HttpRequest, HttpResponse, AuthUser } from './types/http';

// const server = createServer(async (req, res) => {
//   const request: HttpRequest = {
//     url: req.url,
//     method: req.method,
//     headers: req.headers,
//     user: {
//       id: '1',
//       userName: 'actingAdmin',
//       roles: [PolicyEnum.SiteActingAdmin],
//       claims: [{ type: 'Policy', value: 'siteactingadmin' }],
//     } as AuthUser,
//   };

//   const response: HttpResponse = {
//     statusCode: 200,
//     setHeader: res.setHeader.bind(res),
//     end: res.end.bind(res),
//   };

//   if (req.url === '/admin') {
//     return requirePolicy([PolicyEnum.SiteActingAdmin])(request, response);
//   }

//   response.statusCode = 200;
//   response.end('Public route');
// });

// server.listen(3000, () => console.log('Server running on port 3000'));
// ```

// ### ✅ Why This Works
// - **Loose but strict**:  
//   - Loose enough to map onto Express’s `req/res`, Koa’s `ctx.request/ctx.response`, Fastify’s `request/reply`, or NestJS’s `ExecutionContext`.  
//   - Strict enough to enforce PBAC requirements: we *must* have `user.roles` and `user.claims`.  
// - **Framework‑agnostic**: No dependency on Express types.  
// - **Reusable**: Same middleware logic works across raw Node, Express, Koa, Fastify, NestJS.  
