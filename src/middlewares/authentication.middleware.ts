// ### 1. Minimal Node.js Authentication Middleware
// Here’s a simple example using a bearer token:

import { IncomingMessage, ServerResponse } from "http";
import { ClaimsPrincipal, Claim } from "../claims/index.js";
import { NextFn } from "./types.js";
import { UserClaimsPrincipalFactory } from "../core/extensions/user.claims.principal.factory.js";
import { IdentityUser } from "../core/types/index.js";

export async function useAuthentication(
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFn
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token → anonymous user
    (req as any).user = null;
    return next();
  }

  const token = authHeader.substring("Bearer ".length);

  // For demo: decode token manually or validate with JWT library
  try {
    // Example: parse JWT payload
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());

    const user = new IdentityUser();
    user.id = payload.sub ?? null;
    
    console.log("Authentication ", user);
    if (user.id) {
      // const factory = new UserClaimsPrincipalFactory();
      // factory.createAsync(user).then((User: ClaimsPrincipal) => {
      //   (req as any).user = User;
      // })
    }

    return next();
  } catch (err) {
    res.statusCode = 401;
    res.end("Invalid token");
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
