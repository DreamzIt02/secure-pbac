// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { ClaimsPrincipal } from "../claims/claims.principal.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationRequirement } from "./types/index.js";

/**
 * A type used to provide an AuthorizationHandlerContext used for authorization.
 */
export interface IAuthorizationHandlerContextFactory {
  /**
   * Creates an AuthorizationHandlerContext used for authorization.
   * @param requirements The requirements to evaluate.
   * @param user The user to evaluate the requirements against.
   * @param resource An optional resource the policy should be checked with.
   *                 If a resource is not required for policy evaluation one may pass null.
   * @returns The AuthorizationHandlerContext.
   */
  createContext(
    requirements: Iterable<IAuthorizationRequirement>,
    user: ClaimsPrincipal,
    resource: object | null
  ): AuthorizationHandlerContext;
}

/**
 * Default factory that creates AuthorizationHandlerContext instances.
 */
export class DefaultAuthorizationHandlerContextFactory
  implements IAuthorizationHandlerContextFactory
{
  /**
   * Creates an AuthorizationHandlerContext used for authorization.
   * @param requirements The requirements to evaluate.
   * @param user The user to evaluate the requirements against.
   * @param resource An optional resource the policy should be checked with.
   * @returns The AuthorizationHandlerContext.
   */
  public createContext(
    requirements: Iterable<IAuthorizationRequirement>,
    user: ClaimsPrincipal,
    resource: object | null
  ): AuthorizationHandlerContext {
    return new AuthorizationHandlerContext(Object.freeze([...requirements]), user, resource);
  }
}
