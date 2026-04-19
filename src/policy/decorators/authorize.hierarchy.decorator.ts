import { IAuthorizationRequirement } from "../../core/types/index.js";
import { isEmpty } from "../../utils.js";
import { ClaimExpression, PolicyHierarchyAuthorizationRequirement } from "../index.js";

export function AuthorizeHierarchy(
  policies         : Iterable<string>, 
  expressionFactory: () => ClaimExpression,
): Function {
  return function (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    const requirements: IAuthorizationRequirement[] = [];

    if (policies && !isEmpty(policies)) {
      requirements.push(new PolicyHierarchyAuthorizationRequirement(policies, expressionFactory))
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
