

import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { IdentityError, IdentityErrorDescriber, IdentityResult, IUserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";

/// <summary>
/// Provides an abstraction for user validation.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export interface IUserValidator<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> {
    /// <summary>
    /// Validates the specified user as an asynchronous operation.
    /// </summary>
    /// <param name="manager">The UserManager{TUser} that can be used to retrieve user properties.</param>
    /// <param name="user">The user to validate.</param>
    /// <returns>The Promise that represents the asynchronous operation, containing the IdentityResult of the validation operation.</returns>
    validateAsync(manager: IUserManager<TKey, TUser>, user: TUser): Promise<IdentityResult>;
}

/// <summary>
/// Provides validation services for user classes.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export class UserValidator<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserValidator<TKey, TUser> {
    /// <summary>
    /// Creates a new instance of UserValidator{TUser}.
    /// </summary>
    /// <param name="errors">The IdentityErrorDescriber used to provide error messages.</param>
    constructor(errors?: IdentityErrorDescriber) {
        this.describer = errors ?? new IdentityErrorDescriber();
    }

    /// <summary>
    /// Gets the IdentityErrorDescriber used to provide error messages for the current UserValidator{TUser}.
    /// </summary>
    public describer: IdentityErrorDescriber;

    /// <summary>
    /// Validates the specified user as an asynchronous operation.
    /// </summary>
    public async validateAsync(manager: IUserManager<TKey, TUser>, user: TUser): Promise<IdentityResult> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        ArgumentNullThrowHelper.throwIfNull(user);
        let errors = await this.validateUserName(manager, user);
        
        if (errors?.length && errors.length > 0)
            return IdentityResult.failed(errors);

        if (manager.options.user.requireUniqueEmail) {
            errors = await this.validateEmail(manager, user, errors);
        }
        if (errors?.length && errors.length > 0)
            return IdentityResult.failed(errors);

        return IdentityResult.success();
    }

    private async validateUserName(manager: IUserManager<TKey, TUser>, user: TUser): Promise<IdentityError[] | null> {
        let errors: IdentityError[] | null = null;
        const userName = await manager.getUserNameAsync(user);

        if (!userName || userName.trim().length === 0) {
            errors ??= [];
            errors.push(this.describer.invalidUserName(userName));
        } else if (manager.options.user.allowedUserNameCharacters &&
            [...userName].some(c => !manager.options.user.allowedUserNameCharacters.includes(c))) {
            errors ??= [];
            errors.push(this.describer.invalidUserName(userName));
        } else {
            const owner = await manager.findByNameAsync(userName);
            if (owner &&
                (await manager.getUserIdAsync(owner)) !== (await manager.getUserIdAsync(user))) {
                errors ??= [];
                errors.push(this.describer.duplicateUserName(userName));
            }
        }
        return errors;
    }

    // make sure email is not empty, valid, and unique
    private async validateEmail(manager: IUserManager<TKey, TUser>, user: TUser, errors: IdentityError[] | null): Promise<IdentityError[] | null> {
        const email = await manager.getEmailAsync(user);
        if (!email || email.trim().length === 0) {
            errors ??= [];
            errors.push(this.describer.invalidEmail(email));
        } 
        else if (!EmailAddressAttribute.isValid(email)) {
            errors ??= [];
            errors.push(this.describer.invalidEmail(email));
        } 
        else {
            const owner = await manager.findByEmailAsync(email);
            if (owner &&
                (await manager.getUserIdAsync(owner)) !== (await manager.getUserIdAsync(user))) {
                errors ??= [];
                errors.push(this.describer.duplicateEmail(email));
            }
        }
        return errors;
    }
}

/// <summary>
/// Represents a .NET-like EmailAddressAttribute placeholder for symmetry.
/// </summary>
export class EmailAddressAttribute {
    static isValid(email: string): boolean {
        // Simple stub for symmetry
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
