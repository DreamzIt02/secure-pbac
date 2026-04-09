// authorization.failure.reason.ts

import { ArgumentNullThrowHelper } from "../types/exception.js";
import { IAuthorizationHandler } from "./types/index.js";

/**
 * Encapsulates a reason why authorization failed.
 *
 * Mirrors ASP.NET Core's AuthorizationFailureReason.
 */
export class AuthorizationFailureReason {
  /**
   * The message describing the failure reason.
   */
  public readonly message: string;

  /**
   * The IAuthorizationHandler responsible for this failure reason.
   */
  public readonly handler: IAuthorizationHandler;

  /**
   * Creates a new failure reason.
   *
   * @param handler The handler responsible for this failure reason.
   * @param message The message describing the failure.
   */
  constructor(handler: IAuthorizationHandler, message: string) {
    ArgumentNullThrowHelper.throwIfNull(handler)
    ArgumentNullThrowHelper.throwIfNullOrEmpty(message)
    
    this.handler = handler;
    this.message = message;
  }

  /**
   * Returns a string representation of the failure reason.
   */
  public toString(): string {
    return `${this.constructor.name}: Handler=${this.handler.constructor.name}, Message=${this.message}`;
  }
}
