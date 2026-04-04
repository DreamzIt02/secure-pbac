// Licensed under MIT-style license (conceptual port of ASP.NET Core Identity SignInManager)

import { UserManager, User, IdentityResult, IdentityError } from "./user.manager.js";

/**
 * Provides APIs for handling user sign-in and authentication lifecycle.
 */
export class SignInManager<TUser extends User> {
  constructor(private readonly userManager: UserManager<TUser>) {}

  /**
   * Signs in the specified user.
   * In a real implementation, this would issue a cookie or JWT.
   */
  async signInAsync(user: TUser): Promise<IdentityResult> {
    if (!await this.userManager.canSignInAsync(user)) {
      return IdentityResult.failed([new IdentityError("LockedOut", "User cannot sign in")]);
    }
    (user as any).isSignedIn = true;
    return IdentityResult.success();
  }

  /**
   * Signs out the specified user.
   */
  async signOutAsync(user: TUser): Promise<void> {
    (user as any).isSignedIn = false;
  }

  /**
   * Checks if the user is currently signed in.
   */
  async isSignedInAsync(user: TUser): Promise<boolean> {
    return !!(user as any).isSignedIn;
  }

  /**
   * Attempts to sign in with password.
   */
  async passwordSignInAsync(user: TUser, password: string): Promise<IdentityResult> {
    if (!await this.userManager.checkPasswordAsync(user, password)) {
      await this.userManager.accessFailedAsync(user);
      return IdentityResult.failed([new IdentityError("InvalidPassword", "Password sign-in failed")]);
    }
    return this.signInAsync(user);
  }

  /**
   * Attempts to sign in with recovery code.
   */
  async recoveryCodeSignInAsync(user: TUser, code: string): Promise<IdentityResult> {
    const redeemed = await this.userManager.redeemRecoveryCodeAsync(user, code);
    if (!redeemed) {
      return IdentityResult.failed([new IdentityError("InvalidCode", "Recovery code sign-in failed")]);
    }
    return this.signInAsync(user);
  }

  /**
   * Attempts to sign in with external login provider.
   */
  async externalLoginSignInAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult> {
    const logins = await this.userManager.getLoginsAsync(user);
    const match = logins.find(l => l.loginProvider === loginProvider && l.providerKey === providerKey);
    if (!match) {
      return IdentityResult.failed([new IdentityError("InvalidLogin", "External login not found")]);
    }
    return this.signInAsync(user);
  }

  /**
   * Refreshes the user's sign-in by updating the security stamp.
   */
  async refreshSignInAsync(user: TUser): Promise<void> {
    await this.userManager.updateSecurityStampAsync(user);
    (user as any).isSignedIn = true;
  }

  /**
   * Checks if the user can sign in (delegates to UserManager).
   */
  async canSignInAsync(user: TUser): Promise<boolean> {
    return this.userManager.canSignInAsync(user);
  }

  /**
   * Checks if the user is locked out (delegates to UserManager).
   */
  async isLockedOutAsync(user: TUser): Promise<boolean> {
    return this.userManager.isLockedOutAsync(user);
  }
}
