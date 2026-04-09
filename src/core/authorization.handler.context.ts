// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { ClaimsPrincipal } from "../claims/claims.principal.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { AuthorizationFailureReason } from "./authorization.failure.reason.js";
import { IAuthorizationRequirement } from "./types/index.js";

/**
 * Contains authorization information used by IAuthorizationHandler.
 */
export class AuthorizationHandlerContext {
  private readonly _pendingRequirements: Set<IAuthorizationRequirement>;
  private _failedReasons: AuthorizationFailureReason[] = [];
  private _failCalled = false;
  private _succeedCalled = false;

  /**
   * Creates a new instance of AuthorizationHandlerContext.
   * @param requirements A collection of all the IAuthorizationRequirement for the current authorization action.
   * @param user A representation of the current user (ClaimsPrincipal equivalent).
   * @param resource An optional resource to evaluate the requirements against.
   */
  constructor(
    private readonly _requirements: Iterable<IAuthorizationRequirement>,
    private readonly _user: ClaimsPrincipal,
    private readonly _resource: object | null
  ) {
    ArgumentNullThrowHelper.throwIfNull(_requirements);

    this._pendingRequirements = new Set(_requirements);
  }

  /**
   * The collection of all the IAuthorizationRequirement for the current authorization action.
   */
  public get requirements(): Iterable<IAuthorizationRequirement> {
    return this._requirements;
  }

  /**
   * The representation of the current user.
   */
  public get user(): ClaimsPrincipal {
    return this._user;
  }
 
  /**
   * The optional resource to evaluate the requirements against.
   */
  public get resource(): object | null {
    return this._resource;
  }

  /**
   * Gets the requirements that have not yet been marked as succeeded.
   */
  public get pendingRequirements(): Iterable<IAuthorizationRequirement> {
    return Array.from(this._pendingRequirements);
  }

  /**
   * Gets the reasons why authorization has failed.
   */
  public get failureReasons(): AuthorizationFailureReason[] {
    return this._failedReasons.length > 0 ? this._failedReasons : [];
  }

  /**
   * Flag indicating whether the current authorization processing has failed due to Fail being called.
   */
  public get hasFailed(): boolean {
    return this._failCalled;
  }

  /**
   * Flag indicating whether the current authorization processing has succeeded.
   * Returns true only if no failures were called, at least one succeed was called,
   * and all requirements have been satisfied.
   */
  public get hasSucceeded(): boolean {
    return !this._failCalled && this._succeedCalled && this._pendingRequirements.size === 0;
  }

  /**
   * Called to indicate HasSucceeded will never return true, even if all requirements are met.
   */
  public fail(reason?: AuthorizationFailureReason): void {
    this._failCalled = true;
    if (reason) {
      if (!this._failedReasons)
          this._failedReasons = [];

      this._failedReasons.push(reason);
    }
  }

  /**
   * Called to mark the specified requirement as being successfully evaluated.
   * @param requirement The requirement whose evaluation has succeeded.
   */
  public succeed(requirement: IAuthorizationRequirement): void {
    this._succeedCalled = true;
    this._pendingRequirements.delete(requirement);
  }
}
