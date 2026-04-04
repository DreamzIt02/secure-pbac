// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { IAuthorizationRequirement } from "./types.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";

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
    requirements: readonly IAuthorizationRequirement[],
    user: any,
    resource: any
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
    requirements: readonly IAuthorizationRequirement[],
    user: any,
    resource: any
  ): AuthorizationHandlerContext {
    return new AuthorizationHandlerContext(requirements, user, resource);
  }
}
