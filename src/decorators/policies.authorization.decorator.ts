import { AuthorizeClaimEnum } from "../claims/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { GroupPolicyEnum } from "../policies/index.js";

/**
 * PoliciesAuthorizationAttribute
 *
 * A decorator/filter that authorizes the User for Site Policy.
 *
 * If an optional array of claims added
 *
 * Matches any (or specific number of claims), If user has then authorized
 *
 * Remarks:
 *     Default number of claims matches is ONE
 */
// export function PoliciesAuthorization(groupPolicy: GroupPolicyEnum, claims?: AuthorizeClaimEnum[]) {
//   return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {

//     const requirements: IAuthorizationRequirement[] = [new PoliciesAuthorizationRequirement(groupPolicy)];
//     if (claims) {
//       requirements.push(new PolicyClaimsAuthorizationRequirement(claims, matchCount));
//     }
//     const fn = descriptor ? descriptor.value : target;

//     const existing = (fn as any).__requirements || [];
//     Reflect.defineProperty(fn, "__requirements", {
//       value: [...existing, ...requirements],
//       writable: false,
//       enumerable: false,
//       configurable: true
//     });
//   };
// }