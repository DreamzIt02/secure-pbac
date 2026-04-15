

import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { createHmac } from "../../utils.js";
import { UserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";
import { IUserTwoFactorTokenProvider } from "./user.two_factor.token.provider.js";

/// <summary>
/// Represents a token provider that generates time-based codes using the user's security stamp.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export abstract class TotpSecurityStampBasedTokenProvider<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>
    implements IUserTwoFactorTokenProvider<TKey, TUser> {
    /// <summary>
    /// Generates a token for the specified user and purpose.
    /// </summary>
    public async generateAsync(purpose: string, manager: UserManager<TKey, TUser>, user: TUser): Promise<string> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const token = await manager.createSecurityTokenAsync(user);
        const modifier = await this.getUserModifierAsync(purpose, manager, user);

        const code = Rfc6238AuthenticationService.generateCode(token, modifier);
        return code.toString().padStart(6, "0");
    }

    /// <summary>
    /// Returns a flag indicating whether the specified token is valid for the given user and purpose.
    /// </summary>
    public async validateAsync(purpose: string, token: string, manager: UserManager<TKey, TUser>, user: TUser): Promise<boolean> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const code = parseInt(token, 10);
        if (isNaN(code)) return false;

        const securityToken = await manager.createSecurityTokenAsync(user);
        const modifier = await this.getUserModifierAsync(purpose, manager, user);

        return securityToken != null && Rfc6238AuthenticationService.validateCode(securityToken, code, modifier);
    }

    /// <summary>
    /// Returns a constant, provider and user unique modifier used for entropy in generated tokens from user information.
    /// </summary>
    public async getUserModifierAsync(purpose: string, manager: UserManager<TKey, TUser>, user: TUser): Promise<string> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const userId = await manager.getUserIdAsync(user);

        return `Totp:${purpose}:${userId}`;
    }

    /// <summary>
    /// Returns a flag indicating whether the token provider can generate a token suitable for two-factor authentication token for the specified user.
    /// </summary>
    public abstract canGenerateTwoFactorTokenAsync(manager: UserManager<TKey, TUser>, user: TUser): Promise<boolean>;
}

/// <summary>
/// Represents a .NET-like Rfc6238AuthenticationService placeholder for symmetry.
/// </summary>
export class Rfc6238AuthenticationService {
    private static timestep = 30; // 30 seconds

    static generateCode(token: Uint8Array, modifier: string): number {
        // FIXME: Stubbed implementation for symmetry
        const timestep = Math.floor(Date.now() / 1000 / this.timestep);
        // const data = Buffer.from(`${token}${modifier}${timestep}`);
        const data = Buffer.concat([Buffer.from(token), Buffer.from(modifier)]);
        const token1 = Buffer.from(token);
        // const hmac = crypto.createHmac("sha1", token).update(data).digest();
        // const hmac = crypto.createHmac("sha1", Buffer.from(token)).update(data).digest();
        const hmac = createHmac("sha1", token1, data);

        const offset = hmac[hmac.length - 1] & 0xf;
        const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

        return binary % 1000000; // 6-digit code
    }

    static validateCode(token: Uint8Array, code: number, modifier: string): boolean {
        const expected = this.generateCode(token, modifier);
        return expected === code;
    }
}
