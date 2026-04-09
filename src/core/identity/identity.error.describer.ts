import { IdentityError } from "./identity.error.js";

/**
 * Service to enable localization for application-facing identity errors.
 *
 * This class provides factory methods to create standardized `IdentityError`
 * instances for common identity failure scenarios. Each method returns an
 * `IdentityError` with a machine-readable `code` and a human-readable
 * `description`. The descriptions can be localized or customized for
 * application needs.
 *
 * Example usage:
 * ```ts
 * const describer = new IdentityErrorDescriber();
 * const error = describer.passwordMismatch();
 * console.log(error.code);        // "PasswordMismatch"
 * console.log(error.description); // "Passwords do not match."
 * ```
 */
export class IdentityErrorDescriber {
  /**
   * Returns the default identity error.
   */
  defaultError(): IdentityError {
    return new IdentityError("DefaultError", "An unknown failure has occurred.");
  }

  /**
   * Returns an error indicating a concurrency failure.
   */
  concurrencyFailure(): IdentityError {
    return new IdentityError("ConcurrencyFailure", "Optimistic concurrency failure, object has been modified.");
  }

  /**
   * Returns an error indicating a password mismatch.
   */
  passwordMismatch(): IdentityError {
    return new IdentityError("PasswordMismatch", "Incorrect password.");
  }

  /**
   * Returns an error indicating an invalid token.
   */
  invalidToken(): IdentityError {
    return new IdentityError("InvalidToken", "Invalid token.");
  }

  /**
   * Returns an error indicating a recovery code was not redeemed.
   */
  recoveryCodeRedemptionFailed(): IdentityError {
    return new IdentityError("RecoveryCodeRedemptionFailed", "Recovery code redemption failed.");
  }

  /**
   * Returns an error indicating an external login is already associated.
   */
  loginAlreadyAssociated(): IdentityError {
    return new IdentityError("LoginAlreadyAssociated", "A user with this external login already exists.");
  }

  /**
   * Returns an error indicating the specified user name is invalid.
   */
  invalidUserName(userName?: string): IdentityError {
    return new IdentityError("InvalidUserName", `User name '${userName ?? ""}' is invalid.`);
  }

  /**
   * Returns an error indicating the specified email is invalid.
   */
  invalidEmail(email?: string): IdentityError {
    return new IdentityError("InvalidEmail", `Email '${email ?? ""}' is invalid.`);
  }

  /**
   * Returns an error indicating the specified user name already exists.
   */
  duplicateUserName(userName: string): IdentityError {
    return new IdentityError("DuplicateUserName", `User name '${userName}' is already taken.`);
  }

  /**
   * Returns an error indicating the specified email is already associated.
   */
  duplicateEmail(email: string): IdentityError {
    return new IdentityError("DuplicateEmail", `Email '${email}' is already associated with an account.`);
  }

  /**
   * Returns an error indicating the specified role name is invalid.
   */
  invalidRoleName(role?: string): IdentityError {
    return new IdentityError("InvalidRoleName", `Role name '${role ?? ""}' is invalid.`);
  }

  /**
   * Returns an error indicating the specified role name already exists.
   */
  duplicateRoleName(role: string): IdentityError {
    return new IdentityError("DuplicateRoleName", `Role name '${role}' already exists.`);
  }

  /**
   * Returns an error indicating a user already has a password.
   */
  userAlreadyHasPassword(): IdentityError {
    return new IdentityError("UserAlreadyHasPassword", "User already has a password set.");
  }

  /**
   * Returns an error indicating user lockout is not enabled.
   */
  userLockoutNotEnabled(): IdentityError {
    return new IdentityError("UserLockoutNotEnabled", "Lockout is not enabled for this user.");
  }

  /**
   * Returns an error indicating a user is already in the specified role.
   */
  userAlreadyInRole(role: string): IdentityError {
    return new IdentityError("UserAlreadyInRole", `User already in role '${role}'.`);
  }

  /**
   * Returns an error indicating a user is not in the specified role.
   */
  userNotInRole(role: string): IdentityError {
    return new IdentityError("UserNotInRole", `User is not in role '${role}'.`);
  }

  /**
   * Returns an error indicating a password is too short.
   */
  passwordTooShort(length: number): IdentityError {
    return new IdentityError("PasswordTooShort", `Passwords must be at least ${length} characters.`);
  }

  /**
   * Returns an error indicating a password requires more unique characters.
   */
  passwordRequiresUniqueChars(uniqueChars: number): IdentityError {
    return new IdentityError("PasswordRequiresUniqueChars", `Passwords must use at least ${uniqueChars} different characters.`);
  }

  /**
   * Returns an error indicating a password requires a non-alphanumeric character.
   */
  passwordRequiresNonAlphanumeric(): IdentityError {
    return new IdentityError("PasswordRequiresNonAlphanumeric", "Passwords must have at least one non alphanumeric character.");
  }

  /**
   * Returns an error indicating a password requires a digit.
   */
  passwordRequiresDigit(): IdentityError {
    return new IdentityError("PasswordRequiresDigit", "Passwords must have at least one digit ('0'-'9').");
  }

  /**
   * Returns an error indicating a password requires a lowercase letter.
   */
  passwordRequiresLower(): IdentityError {
    return new IdentityError("PasswordRequiresLower", "Passwords must have at least one lowercase ('a'-'z').");
  }

  /**
   * Returns an error indicating a password requires an uppercase letter.
   */
  passwordRequiresUpper(): IdentityError {
    return new IdentityError("PasswordRequiresUpper", "Passwords must have at least one uppercase ('A'-'Z').");
  }
}
