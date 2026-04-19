import { IAuthorizationRequirement } from "../../core/types/index.js";
import { ClaimExpression, PolicyClaimsAuthorizationRequirement, PolicyDefaultAuthorizationRequirement, PolicyExpression, PolicyRolesAuthorizationRequirement, RoleExpression } from "../index.js";

export function AuthorizePolicy(
  policies?: () => PolicyExpression, 
  roles?:    () => RoleExpression, 
  claims?:   () => ClaimExpression 
): Function {
  return function (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    const requirements: IAuthorizationRequirement[] = [];

    if (policies) {
      requirements.push(new PolicyDefaultAuthorizationRequirement(policies))
    }

    if (roles) {
      requirements.push(new PolicyRolesAuthorizationRequirement(roles))
    }

    if (claims) {
      requirements.push(new PolicyClaimsAuthorizationRequirement(claims))
    }

    if (requirements.length < 1)
      throw new Error(`There is no requirements defined.`);
    
    const fn = descriptor ? descriptor.value : target;
    const existing = (fn as any).__requirements || [];

    Reflect.defineProperty(fn, "__requirements", {
      value: [...existing, ...requirements],
      writable: false,
      enumerable: false,
      configurable: true
    });
  };
}