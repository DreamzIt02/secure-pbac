

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
  constructor(handlers: Iterable<IAuthorizationHandler>) {
    ArgumentNullThrowHelper.throwIfNull(handlers);

    this.handlersPromise = Promise.resolve(handlers);
  }

  /**
   * Return the handlers that will be called for the authorization request.
   * @param context The AuthorizationHandlerContext.
   * @returns A promise resolving to the list of handlers.
   */
  public getHandlersAsync(context: AuthorizationHandlerContext): Promise<Iterable<IAuthorizationHandler>> {
    // FIXME: if (!this.handlersPromise)
    //   return new DefaultAuthorizationHandlerProvider(context.requirements as Iterable<IAuthorizationHandler>).handlersPromise;

    return this.handlersPromise;
  }
}
