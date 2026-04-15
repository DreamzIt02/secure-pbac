

import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { UserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";
import { TotpSecurityStampBasedTokenProvider } from "./totp.security_stamp_based.token.provider.js";
import { IUserTwoFactorTokenProvider } from "./user.two_factor.token.provider.js";

/// <summary>
/// Used for authenticator code verification.
/// </summary>
export class AuthenticatorTokenProvider<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>
    extends TotpSecurityStampBasedTokenProvider<TKey, TUser>
    implements IUserTwoFactorTokenProvider<TKey, TUser>
{
    /// <summary>
    /// Checks if a two-factor authentication token can be generated for the specified <paramref name="user"/>.
    /// </summary>
    /// <param name="manager">The <see cref="UserManager{TUser}"/> to retrieve the <paramref name="user"/> from.</param>
    /// <param name="user">The <typeparamref name="TUser"/> to check for the possibility of generating a two-factor authentication token.</param>
    /// <returns>True if the user has an authenticator key set, otherwise false.</returns>
    async canGenerateTwoFactorTokenAsync(manager: UserManager<TKey, TUser>, user: TUser): Promise<boolean> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        
        let key = await manager.getAuthenticatorKeyAsync(user);

        return !!key;
    }

    /// <summary>
    /// Returns an empty string since no authenticator codes are sent.
    /// </summary>
    /// <param name="purpose">Ignored.</param>
    /// <param name="manager">The <see cref="UserManager{TUser}"/> to retrieve the <paramref name="user"/> from.</param>
    /// <param name="user">The <typeparamref name="TUser"/>.</param>
    /// <returns>string.Empty.</returns>
    async generateAsync(purpose: string, manager: UserManager<TKey, TUser>, user: TUser): Promise<string> {
        ArgumentNullThrowHelper.throwIfNull(manager);

        return super.generateAsync(purpose, manager, user);
    }

    /// <summary>
    ///
    /// </summary>
    /// <param name="purpose"></param>
    /// <param name="token"></param>
    /// <param name="manager"></param>
    /// <param name="user"></param>
    /// <returns></returns>
    async validateAsync(purpose: string, token: string, manager: UserManager<TKey, TUser>, user: TUser): Promise<boolean> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        
        return super.validateAsync(purpose, token, manager, user);
    }
}
