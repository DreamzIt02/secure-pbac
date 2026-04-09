import { IdentityError } from "./identity.error.js";
import { IIdentityResult } from "./types.js";

/**
 * Represents the result of an identity operation.
 *
 * This class encapsulates whether an identity operation succeeded or failed,
 * and provides a collection of `IdentityError` objects describing the reasons
 * for failure when applicable.
 *
 * Example usage:
 * ```ts
 * const success = IdentityResult.success();
 * console.log(success.succeeded); // true
 *
 * const failure = IdentityResult.failed([
 *   new IdentityError("DuplicateUserName", "The user name 'alice' is already taken.")
 * ]);
 * console.log(failure.succeeded); // false
 * console.log(failure.errors[0].description); // "The user name 'alice' is already taken."
 * ```
 */
export class IdentityResult implements IIdentityResult {
  /**
   * Flag indicating whether the operation succeeded.
   *
   * `true` if the operation succeeded, otherwise `false`.
   */
  public succeeded: boolean;

  /**
   * A list of `IdentityError` instances containing errors
   * that occurred during the identity operation.
   */
  public errors: IdentityError[];

  /**
   * Creates a new `IdentityResult`.
   *
   * @param succeeded - Whether the operation succeeded.
   * @param errors - Optional list of errors if the operation failed.
   */
  constructor(succeeded: boolean, errors: IdentityError[] = []) {
    this.succeeded = succeeded;
    this.errors = errors;
  }

  /**
   * Returns an `IdentityResult` indicating a successful identity operation.
   */
  static success(): IdentityResult {
    return new IdentityResult(true);
  }

  /**
   * Creates an `IdentityResult` indicating a failed identity operation,
   * with a list of errors if applicable.
   *
   * @param errors - An optional array of `IdentityError`s which caused the operation to fail.
   */
  static failed(errors: IdentityError | IdentityError[]): IdentityResult {
    return new IdentityResult(false, Array.isArray(errors) ? errors : [errors]);
  }

  /**
   * Converts the current `IdentityResult` to its equivalent string representation.
   *
   * @returns A string representation of the current `IdentityResult`.
   *
   * - If the operation was successful, returns `"Succeeded"`.
   * - If the operation failed, returns `"Failed : "` followed by a comma‑delimited
   *   list of error codes from its `errors` collection.
   */
  toString(): string {
    return this.succeeded
      ? "Succeeded"
      : `Failed : ${this.errors.map(e => e.code).join(",")}`;
  }
}
