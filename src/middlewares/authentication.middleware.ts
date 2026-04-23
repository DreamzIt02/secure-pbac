// ### 1. Minimal Node.js Authentication Middleware
// Here’s a simple example using a bearer token:

import { NextFn } from "./types.js";
import { IdentityRole, IdentityUser } from "../core/types/index.js";
import { HttpContext } from "../http/index.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { RoleManager, UserManager } from "../core/identity/index.js";
import { AuthorizeRoleEnum, SiteRole } from "../roles/index.js";
import { UserClaimsPrincipalFactory } from "../core/extensions/index.js";
import { IdentityOptions } from "../core/options/index.js";
import { AuthorizeClaimEnum, Claim, SiteClaim } from "../claims/index.js";

export async function useAuthentication(
  ctx: HttpContext,
  next: NextFn,
) {
  ArgumentNullThrowHelper.throwIfNullOrEmpty(ctx);
  ArgumentNullThrowHelper.throwIfNullOrEmpty(next);

  const authHeader = ctx.request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token → anonymous user
    ctx.user = null as any;
    return next();
  }

  const token = authHeader.substring("Bearer ".length);

  // For demo: decode token manually or validate with JWT library
  try {
    // Example: parse JWT payload
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const userId = payload.sub ?? null;
    
    if (userId) {
      const identityOptions = (ctx.items.get(IdentityOptions) ?? new IdentityOptions()) as IdentityOptions;
      try {
        const userManager = ctx.requestServices.getRequiredService(UserManager);
        const roleManager = ctx.requestServices.getRequiredService(RoleManager);

        const appUser = new IdentityUser();
          appUser.userName = "user1";
          appUser.email = "user1@mail.me";

        const role = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeGeneralAdmin);
        const appRole = new IdentityRole();
        appRole.name = role;

        const claim = SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentContent) as Claim;

        await roleManager.createAsync(appRole);
        await userManager.createAsync(appUser);
        await userManager.addToRoleAsync(appUser, role);
        await userManager.addClaimAsync(appUser, claim);

        // const dbUser = await userManager.findByIdAsync(userId);
        const dbUser = await userManager.findByNameAsync(appUser.userName);
        if (dbUser) {
          const factory = new UserClaimsPrincipalFactory(userManager, roleManager, { value: identityOptions } );
          ctx.user = await factory.createAsync(dbUser);
        }
      } 
      finally {
        ctx.requestServices.dispose();
      }

    }

    return next();
  } catch (err) {
    console.log('ERROR ', err)
    ctx.response.statusCode = 401;
    ctx.response.end("Invalid token");
  }
}

// This attaches a `ClaimsPrincipal` to `req.user`. If no token is present, `req.user` is `null`.

// ### 2. Integrating Passport.js
// If we want enterprise‑grade authentication, we can plug **Passport.js** into our pipeline. Passport provides strategies (JWT, OAuth2, Google, etc.) and automatically attaches `req.user`.

// Example with JWT strategy:

// import passport from "passport";
// import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

// passport.use(
//   new JwtStrategy(
//     {
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: "passport-secret-key"
//     },
//     (jwtPayload, done) => {
//       // Convert JWT payload into ClaimsPrincipal
//       const claims = Object.entries(jwtPayload).map(
//         ([type, value]) => new Claim(type, String(value))
//       );
//       const user = new ClaimsPrincipal(claims);
//       return done(null, user);
//     }
//   )
// );

// export function usePassportAuthentication(req, res, next) {
//   passport.authenticate("jwt", { session: false }, (err, user) => {
//     if (err || !user) {
//       (req as any).user = null;
//       return next();
//     }
//     (req as any).user = user;
//     next();
//   })(req, res, next);
// }

// ### 3. Adding to our Pipeline
// In `App.ts`:

// ```ts
// const app = new App();

// // Add authentication before authorization
// app.use(authenticationMiddleware); // or passportAuthenticationMiddleware

// app.addAuthorization();
// app.useAuthorization();

// app.start(3000);
// ```

// ### ✅ Summary
// - **Bare Node.js**: Write a simple middleware that parses headers, validates tokens, and attaches `req.user`.
// - **Enterprise integration**: Use Passport.js strategies (JWT, OAuth2, etc.) to handle authentication robustly.
// - **Pipeline order**: Authentication middleware → Authorization middleware → Route handler.

// This way our pipeline mirrors ASP.NET Core’s `UseAuthentication()` → `UseAuthorization()` sequence, but in pure Node.js.  
