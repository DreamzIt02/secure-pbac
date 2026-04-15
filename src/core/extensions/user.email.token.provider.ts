
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { IUserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";
import { TotpSecurityStampBasedTokenProvider } from "./totp.security_stamp_based.token.provider.js";

/// <summary>
/// TokenProvider that generates tokens from the user's security stamp and notifies a user via email.
/// </summary>
/// <typeparam name="TUser">The type used to represent a user.</typeparam>
export class EmailTokenProvider<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> extends TotpSecurityStampBasedTokenProvider<TKey, TUser> {
    /// <summary>
    /// Checks if a two-factor authentication token can be generated for the specified <paramref name="user"/>.
    /// </summary>
    /// <param name="manager">The <see cref="UserManager{TUser}"/> to retrieve the <paramref name="user"/> from.</param>
    /// <param name="user">The <typeparamref name="TUser"/> to check for the possibility of generating a two-factor authentication token.</param>
    /// <returns>True if the user has an email address set, otherwise false.</returns>
    public override async canGenerateTwoFactorTokenAsync(manager: IUserManager<TKey, TUser>, user:  TUser): Promise<boolean>
    {
        ArgumentNullThrowHelper.throwIfNull(manager);
        
        let email = await manager.getEmailAsync(user);

        return !!email && await manager.isEmailConfirmedAsync(user);
    }

    /// <summary>
    /// Returns the a value for the user used as entropy in the generated token.
    /// </summary>
    /// <param name="purpose">The purpose of the two-factor authentication token.</param>
    /// <param name="manager">The <see cref="UserManager{TUser}"/> to retrieve the <paramref name="user"/> from.</param>
    /// <param name="user">The <typeparamref name="TUser"/> to check for the possibility of generating a two-factor authentication token.</param>
    /// <returns>A string suitable for use as entropy in token generation.</returns>
    public override async getUserModifierAsync(purpose: string, manager: IUserManager<TKey, TUser>, user:  TUser): Promise<string>
    {
        ArgumentNullThrowHelper.throwIfNull(manager);
        
        let email = await manager.getEmailAsync(user);

        return `Email:${purpose}:${email}`;
    }
}
