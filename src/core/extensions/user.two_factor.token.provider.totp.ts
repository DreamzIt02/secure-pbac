// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { IUserTwoFactorTokenProvider, UserManager } from "./user.two_factor.token.provider.js";

/// <summary>
/// Represents a token provider that generates time-based codes using the user's security stamp.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export abstract class TotpSecurityStampBasedTokenProvider<TUser extends object> implements IUserTwoFactorTokenProvider<TUser> {
    /// <summary>
    /// Generates a token for the specified user and purpose.
    /// </summary>
    public async generateAsync(purpose: string, manager: UserManager<TUser>, user: TUser): Promise<string> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const token = await manager.createSecurityTokenAsync(user);
        const modifier = await this.getUserModifierAsync(purpose, manager, user);

        return Rfc6238AuthenticationService.generateCode(token, modifier).toString().padStart(6, "0");
    }

    /// <summary>
    /// Returns a flag indicating whether the specified token is valid for the given user and purpose.
    /// </summary>
    public async validateAsync(purpose: string, token: string, manager: UserManager<TUser>, user: TUser): Promise<boolean> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const code = parseInt(token, 10);
        if (isNaN(code)) {
            return false;
        }
        const securityToken = await manager.createSecurityTokenAsync(user);
        const modifier = await this.getUserModifierAsync(purpose, manager, user);

        return securityToken != null && Rfc6238AuthenticationService.validateCode(securityToken, code, modifier);
    }

    /// <summary>
    /// Returns a constant, provider and user unique modifier used for entropy in generated tokens from user information.
    /// </summary>
    public async getUserModifierAsync(purpose: string, manager: UserManager<TUser>, user: TUser): Promise<string> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        const userId = await manager.getUserIdAsync(user);

        return `Totp:${purpose}:${userId}`;
    }

    /// <summary>
    /// Returns a flag indicating whether the token provider can generate a token suitable for two-factor authentication token for the specified user.
    /// </summary>
    public abstract canGenerateTwoFactorTokenAsync(manager: UserManager<TUser>, user: TUser): Promise<boolean>;
}

/// <summary>
/// Default concrete implementation of TotpSecurityStampBasedTokenProvider for instantiation.
/// </summary>
export class DefaultUserTwoFactorTokenProvider<TUser extends object> extends TotpSecurityStampBasedTokenProvider<TUser> {
    async generateAsync(purpose: string, manager: UserManager<TUser>, user: TUser): Promise<string> {
        return super.generateAsync(purpose, manager, user);
    }
    async validateAsync(purpose: string, token: string, manager: UserManager<TUser>, user: TUser): Promise<boolean> {
        return super.validateAsync(purpose, token, manager, user);
    }
    async canGenerateTwoFactorTokenAsync(manager: UserManager<TUser>, user: TUser): Promise<boolean> {
        // FIXME: Stubbed implementation for symmetry
        return true
    }
}

/// <summary>
/// Represents a .NET-like ArgumentNullThrowHelper placeholder for symmetry.
/// </summary>
export class ArgumentNullThrowHelper {
    static throwIfNull(value: unknown): void {
        if (value === null || value === undefined) {
            throw new Error("ArgumentNullException");
        }
    }
}

/// <summary>
/// Represents a .NET-like Rfc6238AuthenticationService placeholder for symmetry.
/// </summary>
export class Rfc6238AuthenticationService {
    static generateCode(token: string, modifier: string): number {
        // FIXME: Stubbed implementation for symmetry
        return 123456;
    }

    static validateCode(token: string, code: number, modifier: string): boolean {
        // FIXME: Stubbed implementation for symmetry
        return true;
    }
}
