

import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { IdentityError, IdentityErrorDescriber, IdentityResult, IUserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";

/// <summary>
/// Provides an abstraction for validating passwords.
/// </summary>
/// <typeparam name="TUser">The type that represents a user.</typeparam>
export interface IPasswordValidator<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> {
    /// <summary>
    /// Validates a password as an asynchronous operation.
    /// </summary>
    /// <param name="manager">The UserManager{TUser} to retrieve the user properties from.</param>
    /// <param name="user">The user whose password should be validated.</param>
    /// <param name="password">The password supplied for validation</param>
    /// <returns>The Promise object representing the asynchronous operation.</returns>
    validateAsync(manager: IUserManager<TKey, TUser>, user: TUser, password: string | null): Promise<IdentityResult>;
}

/// <summary>
/// Provides the default password policy for Identity.
/// </summary>
/// <typeparam name="TUser">The type that represents a user.</typeparam>
export class PasswordValidator<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IPasswordValidator<TKey, TUser> {
    /// <summary>
    /// Constructs a new instance of PasswordValidator{TUser}.
    /// </summary>
    /// <param name="errors">The IdentityErrorDescriber to retrieve error text from.</param>
    constructor(errors?: IdentityErrorDescriber) {
        this.describer = errors ?? new IdentityErrorDescriber();
    }

    /// <summary>
    /// Gets the IdentityErrorDescriber used to supply error text.
    /// </summary>
    public describer: IdentityErrorDescriber;

    /// <summary>
    /// Validates a password as an asynchronous operation.
    /// </summary>
    /// <param name="manager">The UserManager{TUser} to retrieve the user properties from.</param>
    /// <param name="user">The user whose password should be validated.</param>
    /// <param name="password">The password supplied for validation</param>
    /// <returns>The Promise object representing the asynchronous operation.</returns>
    public async validateAsync(manager: IUserManager<TKey, TUser>, user: TUser, password: string | null): Promise<IdentityResult> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        let errors: IdentityError[] | null = null;
        const options = manager.options.password;
        password ??= "";
        if (!password.trim() || password.length < options.requiredLength) {
            errors ??= [];
            errors.push(this.describer.passwordTooShort(options.requiredLength));
        }
        if (options.requireNonAlphanumeric && [...password].every(c => this.isLetterOrDigit(c))) {
            errors ??= [];
            errors.push(this.describer.passwordRequiresNonAlphanumeric());
        }
        if (options.requireDigit && ![...password].some(c => this.isDigit(c))) {
            errors ??= [];
            errors.push(this.describer.passwordRequiresDigit());
        }
        if (options.requireLowercase && ![...password].some(c => this.isLower(c))) {
            errors ??= [];
            errors.push(this.describer.passwordRequiresLower());
        }
        if (options.requireUppercase && ![...password].some(c => this.isUpper(c))) {
            errors ??= [];
            errors.push(this.describer.passwordRequiresUpper());
        }
        if (options.requiredUniqueChars >= 1 && new Set(password).size < options.requiredUniqueChars) {
            errors ??= [];
            errors.push(this.describer.passwordRequiresUniqueChars(options.requiredUniqueChars));
        }
        return errors?.length && errors.length > 0 ? IdentityResult.failed(errors) : IdentityResult.success();
    }

    /// <summary>
    /// Returns a flag indicating whether the supplied character is a digit.
    /// </summary>
    public isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    /// <summary>
    /// Returns a flag indicating whether the supplied character is a lower case ASCII letter.
    /// </summary>
    public isLower(c: string): boolean {
        return c >= 'a' && c <= 'z';
    }

    /// <summary>
    /// Returns a flag indicating whether the supplied character is an upper case ASCII letter.
    /// </summary>
    public isUpper(c: string): boolean {
        return c >= 'A' && c <= 'Z';
    }

    /// <summary>
    /// Returns a flag indicating whether the supplied character is an ASCII letter or digit.
    /// </summary>
    public isLetterOrDigit(c: string): boolean {
        return this.isUpper(c) || this.isLower(c) || this.isDigit(c);
    }
}
