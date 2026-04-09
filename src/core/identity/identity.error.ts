import { IIdentityError } from "./types.js";

/**
 * Encapsulates an error from the identity subsystem.
 *
 * This class is used to represent errors that occur during identity operations,
 * such as user creation, password changes, role assignments, or token validation.
 * Each error has a `code` that uniquely identifies the type of error, and a
 * `description` that provides a human-readable explanation suitable for display
 * to end users or logging.
 *
 * Example usage:
 * ```ts
 * const error = new IdentityError("DuplicateUserName", "The user name 'alice' is already taken.");
 * console.log(error.code);        // "DuplicateUserName"
 * console.log(error.description); // "The user name 'alice' is already taken."
 * ```
 */
export class IdentityError implements IIdentityError {
  /**
   * A machine-readable code that uniquely identifies the error type.
   *
   * This should be a short string, often matching the method name in
   * `IdentityErrorDescriber` (e.g., `"InvalidEmail"`, `"PasswordTooShort"`).
   * Consumers of identity APIs can use this code to branch logic or
   * localize error messages.
   */
  public code: string;

  /**
   * A human-readable description of the error.
   *
   * This text is intended to be shown to end users, logged, or used
   * for debugging. It should clearly explain why the operation failed.
   */
  public description: string;

  /**
   * Creates a new instance of `IdentityError`.
   *
   * @param code - The unique error code (e.g., `"InvalidUserName"`).
   * @param description - A human-readable description of the error.
   */
  constructor(code: string, description: string) {
    this.code = code;
    this.description = description;
  }
}
