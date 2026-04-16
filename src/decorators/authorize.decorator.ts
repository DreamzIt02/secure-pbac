import { IClaim } from "../claims/types.js";
import { ClaimsAuthorizationRequirement, RolesAuthorizationRequirement } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { isEmpty } from "../utils.js";

export interface IPolicyClaimsAuthorizationType {
    [claimType: string]: IPolicyClaimsAuthorizationValue;
}
export interface IPolicyClaimsAuthorizationValue {
    claimType: string; allowedValues: Iterable<string> | undefined; emptyAllowedValues: boolean;
}

export function resolveClaimsRequirement(claims: IClaim[]): IPolicyClaimsAuthorizationType[] {
    const dict: { [claimType: string]: Set<string>; } = resolveClaimsDictionary([...claims]);
    const claims_req: Array<IPolicyClaimsAuthorizationType> = [];
    for (const key in dict)
        if (dict.hasOwnProperty(key))
            claims_req.push({
                [key]: { 
                    claimType: key, allowedValues: dict[key].size > 0 ? Object.freeze([...dict[key]]) : undefined, emptyAllowedValues: true }});

    return claims_req
}

export function resolveClaimsDictionary(claims: IClaim[]) {
    const dict: { [claimType: string]: Set<string> } = {};
    for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];

        if (!dict.hasOwnProperty(claim.type))
            dict[claim.type] = new Set<string>();

        if (claim.value)
            dict[claim.type].add(claim.value);
    }
    return dict;
}

export function Authorize(roles?: Iterable<string>, claims?: Iterable<IClaim>): Function {
  return function (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    const requirements: IAuthorizationRequirement[] = [];

    if (roles && !isEmpty(roles)) {
        requirements.push(new RolesAuthorizationRequirement(roles))
    }
    if (claims && !isEmpty(claims)) {
        const dict = resolveClaimsDictionary([...claims]);
        for (const key in dict)
            requirements.push(new ClaimsAuthorizationRequirement(key, dict[key].size > 0 ? Object.freeze([...dict[key]]) : undefined))
    }

    const fn = descriptor ? descriptor.value : target;
    const existing = (fn as any).__requirements || [];

    Reflect.defineProperty(fn, "__requirements", {
        value: [...existing, ...requirements],
        writable: false,
        enumerable: false,
        configurable: true,
    });
  };
}

// @Authorize(["admin"])
// class TestClass {
//   @Authorize(["admin"])
//   method() {}

//   @Authorize(["editor"])
//   someProperty!: string;
// }


// ## 🔧 Example Usage with Routes/Controllers

// Imagine we have a simple controller method:

// ```ts
// import { Authorize } from "./decorators/authorize.js";
// import { Claim } from "./claims/index.js";

// // Controller method requiring a role and a claim
// class UserController {
  
//   @Authorize(["Admin"], [new Claim("department", "IT")])
//   static getSensitiveData(req: IncomingMessage, res: ServerResponse) {
//     res.statusCode = 200;
//     res.end("Sensitive data for IT Admins only");
//   }

//   @Authorize(["User"])
//   static getProfile(req: IncomingMessage, res: ServerResponse) {
//     res.statusCode = 200;
//     res.end("User profile data");
//   }

//   @Authorize()
//   static getPublicInfo(req: IncomingMessage, res: ServerResponse) {
//     res.statusCode = 200;
//     res.end("Public info accessible to all authenticated users");
//   }
// }
// ```

// Here:
// - `@Authorize(["Admin"], [new Claim("department", "IT")])` attaches both a **RolesAuthorizationRequirement** and a **ClaimsAuthorizationRequirement** to the handler metadata.
// - `@Authorize(["User"])` attaches only a role requirement.
// - `@Authorize()` attaches no requirements (but still requires authentication unless `AllowAnonymous` is set).

// ## ⚙️ How the Pipeline Executes

// 1. **Request comes in**  
//    - The Node.js server receives an HTTP request.
//    - `AppIdentityContext.runPipeline()` executes middleware in order.

// 2. **Authorization middleware (`useAuthorization`) runs**  
//    - Extracts `req.user` (our `ClaimsPrincipal`).
//    - Resolves the route handler via `getRouteHandler`.
//    - Reads metadata (`__requirements`) attached by `Authorize`.

// 3. **Requirements collected**  
//    - For `getSensitiveData`, the requirements array contains:
//      - `new RolesAuthorizationRequirement(["Admin"])`
//      - `new ClaimsAuthorizationRequirement("department", ["IT"])`

// 4. **Authorization service invoked**  
//    - `DefaultAuthorizationService.authorizeAsync()` is called with:
//      - The current user (`ClaimsPrincipal`)
//      - The requirements array

// 5. **Handler dispatch**  
//    - The service finds the right handler for each requirement:
//      - `RolesAuthorizationRequirement` → handled by `RolesAuthorizationRequirement` class
//      - `ClaimsAuthorizationRequirement` → handled by `ClaimsAuthorizationRequirement` class

// 6. **Evaluation**  
//    - `RolesAuthorizationRequirement.handleRequirementAsync()` checks if `user.isInRole("Admin")`.
//    - `ClaimsAuthorizationRequirement.handleRequirementAsync()` checks if user has claim `department=IT`.

// 7. **Success or failure**  
//    - If both succeed, `context.succeed(requirement)` is called for each.
//    - The evaluator sees all requirements satisfied → `authResult.succeeded = true`.

// 8. **Pipeline decision**  
//    - Middleware calls `next()` → request proceeds to the controller method.
//    - If any requirement fails, middleware returns `res.forbidden()`.

// ## 🧩 Summary

// - **Decorators** attach requirements to route handlers.  
// - **Middleware** reads those requirements and invokes the authorization service.  
// - **Authorization service** dispatches to our custom handlers (`ClaimsAuthorizationRequirement`, `RolesAuthorizationRequirement`, `PolicyClaimsAuthorizationRequirement`).  
// - **Handlers** evaluate the user’s claims/roles.  
// - **Evaluator** decides if all requirements are satisfied.  
// - **Pipeline** either allows the request (`next()`) or blocks it (`forbidden()`).
