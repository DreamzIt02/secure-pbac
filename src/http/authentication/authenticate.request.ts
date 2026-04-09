/**
 * Exception type for authentication failures.
 */
export class AuthenticationFailureException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationFailureException";
  }
}
