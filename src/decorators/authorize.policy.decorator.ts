import { AppIdentityContext } from "../App.context.js";
import { AUTHORIZATION_SERVICE, IAuthorizationService } from "../core/index.js";
import { IAuthorizationRequirement } from "../core/types/index.js";
import { ClaimExpression, PolicyClaimsAuthorizationRequirement, PolicyDefaultAuthorizationRequirement, PolicyExpression, PolicyRolesAuthorizationRequirement, RoleExpression } from "../policy/index.js";

export function AuthorizePolicy(
  policies?: () => PolicyExpression, 
  roles?: () => RoleExpression, 
  claims?: () => ClaimExpression 
): Function {
  return function (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    const requirements: IAuthorizationRequirement[] = [];
    const authService : IAuthorizationService       = AppIdentityContext.PROVIDER_IDENTITY.resolve<IAuthorizationService>(AUTHORIZATION_SERVICE);

    if (policies) {
      requirements.push(new PolicyDefaultAuthorizationRequirement(policies, authService))
    }

    if (roles) {
      requirements.push(new PolicyRolesAuthorizationRequirement(roles))
    }

    if (claims) {
      requirements.push(new PolicyClaimsAuthorizationRequirement(claims))
    }
    
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