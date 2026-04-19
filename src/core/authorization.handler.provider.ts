

import { ArgumentNullThrowHelper } from "../types/exception.js";
import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationHandler } from "./types/index.js";

/**
 * A type which can provide the IAuthorizationHandlers for an authorization request.
 */
export interface IAuthorizationHandlerProvider {
  /**
   * Return the handlers that will be called for the authorization request.
   * @param context The AuthorizationHandlerContext.
   * @returns A promise resolving to the list of handlers.
   */
  getHandlersAsync(context: AuthorizationHandlerContext): Promise<Iterable<IAuthorizationHandler>>;
}

export class AuthorizationHandlerProvider implements IAuthorizationHandlerProvider {
  getHandlersAsync(context: AuthorizationHandlerContext): Promise<Iterable<IAuthorizationHandler>> {
    throw new Error("Method not implemented.");
  }
}

/**
 * The default implementation of a handler provider,
 * which provides the IAuthorizationHandlers for an authorization request.
 */
export class DefaultAuthorizationHandlerProvider implements IAuthorizationHandlerProvider {
  private readonly handlersPromise: Promise<Iterable<IAuthorizationHandler>>;

  /**
   * Creates a new instance of DefaultAuthorizationHandlerProvider.
   * @param handlers The IAuthorizationHandlers.
   */
  constructor(private readonly handlers: Iterable<IAuthorizationHandler>) {
    ArgumentNullThrowHelper.throwIfNull(handlers);

    this.handlersPromise = Promise.resolve(handlers);
  }

  /**
   * Return the handlers that will be called for the authorization request.
   * @param context The AuthorizationHandlerContext.
   * @returns A promise resolving to the list of handlers.
   */
  public getHandlersAsync(context: AuthorizationHandlerContext): Promise<Iterable<IAuthorizationHandler>> {
    const result: IAuthorizationHandler[] = [];

    // Add global handlers
    for (const h of this.handlers) {
      result.push(h);
    }

    // Add self-handling requirements
    for (const req of context.requirements) {
      if (typeof (req as any).handleRequirementAsync === "function") {
        result.push(req as unknown as IAuthorizationHandler);
      }
    }
    (this.handlers as any) = Object.freeze([...result]);
    (this.handlersPromise as any) = Promise.resolve(this.handlers);
    
    return this.handlersPromise;
  }
  
}
