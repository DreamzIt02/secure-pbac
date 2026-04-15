

/**
 * A type which can log authorization outcomes.
 */
export interface IAuthorizationLogger {
  /**
   * Called when user authorization succeeds.
   */
  userAuthorizationSucceeded(): void;

  /**
   * Called when user authorization fails.
   * @param failure The failure details.
   */
  userAuthorizationFailed(failure: any): void;
}

/**
 * Default implementation of IAuthorizationLogger.
 * Logs to the console by default.
 */
export class DefaultAuthorizationLogger implements IAuthorizationLogger {
  public userAuthorizationSucceeded(): void {
    console.log("Authorization succeeded.");
  }

  public userAuthorizationFailed(failure: any): void {
    console.error("Authorization failed.", failure);
  }
}
