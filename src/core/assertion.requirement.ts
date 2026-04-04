// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { IAuthorizationRequirement, IAuthorizationHandler } from "./types.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";

/**
 * Implements an IAuthorizationHandler and IAuthorizationRequirement
 * that takes a user-specified assertion.
 */
export class AssertionRequirement implements IAuthorizationHandler, IAuthorizationRequirement {
  /**
   * Function that is called to handle this requirement.
   */
  public handler: (context: AuthorizationHandlerContext) => Promise<boolean>;

  /**
   * Creates a new instance of AssertionRequirement with a synchronous handler.
   * @param handler Function that is called to handle this requirement.
   */
  // constructor(handler: (context: AuthorizationHandlerContext) => boolean);
  /**
   * Creates a new instance of AssertionRequirement with an asynchronous handler.
   * @param handler Function that is called to handle this requirement.
   */
  // constructor(handler: (context: AuthorizationHandlerContext) => Promise<boolean>);
  // constructor(handler: ((context: AuthorizationHandlerContext) => boolean) | ((context: AuthorizationHandlerContext) => Promise<boolean>)) {
  //   if (!handler) {
  //     throw new Error("handler cannot be null");
  //   }

  //   // Normalize to async
  //   if (handler.length === 1) {
  //     this.handler = async (ctx: AuthorizationHandlerContext) => {
  //       const result = (handler as (ctx: AuthorizationHandlerContext) => boolean)(ctx);
  //       return Promise.resolve(result);
  //     };
  //   } else {
  //     this.handler = handler as (ctx: AuthorizationHandlerContext) => Promise<boolean>;
  //   }
  // }
  /**
   * Creates a new instance of AssertionRequirement with a synchronous handler.
   * 
   * Or
   * 
   * Creates a new instance of AssertionRequirement with an asynchronous handler.
   * @param handler Function that is called to handle this requirement.
   */
  constructor(handler: (context: AuthorizationHandlerContext) => boolean | Promise<boolean>) {
    if (!handler) {
      throw new Error("handler cannot be null");
    }

    this.handler = async (ctx: AuthorizationHandlerContext) => {
      const result = handler(ctx);
      return result instanceof Promise ? await result : result;
    };
  }

  /**
   * Calls handler to see if authorization is allowed.
   * @param context The authorization information.
   */
  public async handleAsync(context: AuthorizationHandlerContext): Promise<void> {
    if (await this.handler(context)) {
      context.succeed(this);
    }
  }

  /**
   * Returns a string representation of this requirement.
   */
  public toString(): string {
    return "Handler assertion should evaluate to true.";
  }
}
