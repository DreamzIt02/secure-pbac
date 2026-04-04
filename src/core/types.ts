/**
 * Represents an authorization requirement.
 */
export interface IAuthorizationRequirement { }

/**
 * Classes implementing this interface are able to make a decision if authorization is allowed.
 */
export interface IAuthorizationHandler {
  /**
   * Makes a decision if authorization is allowed.
   * @param context The authorization information.
   */
  handleAsync<TContext>(context: TContext | any): Promise<void>;
}
    