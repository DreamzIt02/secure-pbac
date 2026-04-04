import { DefaultPasswordHasher, IPasswordHasher } from "./password.hasher.js";
import { IClaim, IUser } from "./types.js";
import { DefaultUserStore, IUserStore } from "./user.store.js";
import { randomUUID } from "./utils.js";

/**
 * Represents a user in the system.
 */
export interface User<TLogin extends { loginProvider: string, providerKey: string } = any> extends IUser {
  claims?: Claim[];
  isSignedIn?: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  recoveryCodes?: string[];
  logins?: TLogin[];
}

/**
 * Represents a claim (Type + Value).
 */
export class Claim implements IClaim {
  constructor(public type: string, public value: string) {}
}

/**
 * Result of an identity operation.
 */
export class IdentityResult {
  constructor(public succeeded: boolean, public errors: IdentityError[] = []) {}

  static success(): IdentityResult {
    return new IdentityResult(true);
  }

  static failed(errors: IdentityError[]): IdentityResult {
    return new IdentityResult(false, errors);
  }
}

/**
 * Represents an identity error.
 */
export class IdentityError {
  constructor(public code: string, public description: string) {}
}

/**
 * Interface for user persistence store.
 */
export interface UserStore<TUser extends User> extends IUserStore<TUser> {
  
}

/**
 * Provides APIs for managing users in a persistence store.
 */
export class UserManager<TUser extends User> {
  constructor(
    private readonly store: IUserStore<TUser> = new DefaultUserStore(),
    private readonly passwordHasher: IPasswordHasher = new DefaultPasswordHasher()
  ) {
  }

  // -----------------------------
  // Core User CRUD
  // -----------------------------

  /**
   * Creates the specified user in the backing store with optional password.
   */
  async createAsync(user: TUser, password?: string): Promise<IdentityResult> {
    try {
      user.id = randomUUID();
      if (password) {
        user.passwordHash = await this.passwordHasher.hash(password);
      }
      await this.store.create(user);
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("CreateFailed", err.message)]);
    }
  }

  /**
   * Updates the specified user in the backing store.
   */
  async updateAsync(user: TUser): Promise<IdentityResult> {
    try {
      await this.store.update(user);
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("UpdateFailed", err.message)]);
    }
  }

  /**
   * Deletes the specified user from the backing store.
   */
  async deleteAsync(user: TUser): Promise<IdentityResult> {
    try {
      await this.store.delete(user);
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("DeleteFailed", err.message)]);
    }
  }

  /**
   * Finds and returns a user by ID.
   */
  async findByIdAsync(userId: string): Promise<TUser | null> {
    return this.store.findById(userId);
  }

  /**
   * Finds and returns a user by user name.
   */
  async findByNameAsync(userName: string): Promise<TUser | null> {
    return this.store.findByName(userName);
  }

  /**
   * Gets the user name for the specified user.
   */
  async getUserNameAsync(user: TUser): Promise<string | null> {
    return this.store.getUserName(user);
  }

  /**
   * Sets the user name for the specified user.
   */
  async setUserNameAsync(user: TUser, userName: string): Promise<IdentityResult> {
    try {
      await this.store.setUserName(user, userName);
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("SetUserNameFailed", err.message)]);
    }
  }

  /**
   * Gets the user identifier for the specified user.
   */
  async getUserIdAsync(user: TUser): Promise<string> {
    return this.store.getUserId(user);
  }

  // -----------------------------
  // Email Management
  // -----------------------------

  async getEmailAsync(user: TUser): Promise<string | null> {
    return this.store.getEmail ? this.store.getEmail(user) : user.email ?? null;
  }

  async setEmailAsync(user: TUser, email: string): Promise<IdentityResult> {
    try {
      if (!this.store.setEmail) {
        throw new Error("Email persistence not supported by this store");
      }
      await this.store.setEmail(user, email);
      user.email = email;
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("SetEmailFailed", err.message)]);
    }
  }

  async confirmEmailAsync(user: TUser): Promise<IdentityResult> {
    if (!user.email) {
      return IdentityResult.failed([new IdentityError("Invalid", "User has no email")]);
    }
    // In real implementation, mark email confirmed
    return IdentityResult.success();
  }

  // -----------------------------
  // Password Management
  // -----------------------------

  async checkPasswordAsync(user: TUser, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return this.passwordHasher.verify(user.passwordHash, password);
  }

  async changePasswordAsync(user: TUser, currentPassword: string, newPassword: string): Promise<IdentityResult> {
    if (!user.passwordHash) {
      return IdentityResult.failed([new IdentityError("NoPassword", "User has no password set")]);
    }
    const valid = await this.passwordHasher.verify(user.passwordHash, currentPassword);
    if (!valid) {
      return IdentityResult.failed([new IdentityError("InvalidPassword", "Current password is incorrect")]);
    }
    user.passwordHash = await this.passwordHasher.hash(newPassword);
    await this.store.update(user);
    return IdentityResult.success();
  }

  async resetPasswordAsync(user: TUser, newPassword: string): Promise<IdentityResult> {
    user.passwordHash = await this.passwordHasher.hash(newPassword);
    await this.store.update(user);
    return IdentityResult.success();
  }

  async verifyPasswordAsync(user: TUser, password: string): Promise<boolean> {
    return this.checkPasswordAsync(user, password);
  }

  // -----------------------------
  // Claims Management
  // -----------------------------

  async addClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult> {
    if (!user.claims) user.claims = [];
    user.claims.push(claim);
    return IdentityResult.success();
  }

  async addClaimsAsync(user: TUser, claims: Claim[]): Promise<IdentityResult> {
    if (!user.claims) user.claims = [];
    user.claims.push(...claims);
    return IdentityResult.success();
  }

  async replaceClaimAsync(user: TUser, oldClaim: Claim, newClaim: Claim): Promise<IdentityResult> {
    if (!user.claims) return IdentityResult.failed([new IdentityError("Invalid", "User has no claims")]);
    const idx = user.claims.findIndex(c => c.type === oldClaim.type && c.value === oldClaim.value);
    if (idx === -1) {
      return IdentityResult.failed([new IdentityError("Invalid", "Claim not found")]);
    }
    user.claims[idx] = newClaim;
    return IdentityResult.success();
  }

  async replaceClaimsAsync(user: TUser, oldClaims: Claim[], newClaims: Claim[]): Promise<IdentityResult> {
    if (!user.claims) return IdentityResult.failed([new IdentityError("Invalid", "User has no claims")]);
    user.claims = user.claims.filter(c => !oldClaims.some(o => o.type === c.type && o.value === c.value));
    user.claims.push(...newClaims);
    return IdentityResult.success();
  }

  async removeClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult> {
    if (!user.claims) return IdentityResult.failed([new IdentityError("Invalid", "User has no claims")]);
    const idx = user.claims.findIndex(c => c.type === claim.type && c.value === claim.value);
    if (idx === -1) {
      return IdentityResult.failed([new IdentityError("NotFound", "Claim not found")]);
    }
    user.claims.splice(idx, 1);
    return IdentityResult.success();
  }

  async getClaimsAsync(user: TUser): Promise<Claim[]> {
    return user.claims ?? [];
  }

  async hasClaimAsync(user: TUser, claim: Claim): Promise<boolean> {
    return (user.claims ?? []).some(c => c.type === claim.type && c.value === claim.value);
  }

  // -----------------------------
  // Role Management
  // -----------------------------

  async addToRoleAsync(user: TUser, role: string): Promise<IdentityResult> {
    if (!user.roles) user.roles = [];
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      return IdentityResult.success();
    }
    return IdentityResult.failed([new IdentityError("DuplicateRole", `User already in role ${role}`)]);
  }

  async addToRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
    if (!user.roles) user.roles = [];
    for (const role of roles) {
      if (!user.roles.includes(role)) {
        user.roles.push(role);
      }
    }
    return IdentityResult.success();
  }

  async removeFromRoleAsync(user: TUser, role: string): Promise<IdentityResult> {
    if (!user.roles) return IdentityResult.failed([new IdentityError("Invalid", "User has no roles")]);
    const idx = user.roles.indexOf(role);
    if (idx === -1) {
      return IdentityResult.failed([new IdentityError("NotInRole", `User not in role ${role}`)]);
    }
    user.roles.splice(idx, 1);
    return IdentityResult.success();
  }

  async removeFromRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
    if (!user.roles) return IdentityResult.failed([new IdentityError("Invalid", "User has no roles")]);
    user.roles = user.roles.filter(r => !roles.includes(r));
    return IdentityResult.success();
  }

  async getRolesAsync(user: TUser): Promise<string[]> {
    return user.roles ?? [];
  }

  async isInRoleAsync(user: TUser, role: string): Promise<boolean> {
    return user.roles?.includes(role) ?? false;
  }

  async getUsersInRoleAsync(users: TUser[], role: string): Promise<TUser[]> {
    return users.filter(u => u.roles?.includes(role));
  }

  // -----------------------------
  // Lockout Management
  // -----------------------------

  async accessFailedAsync(user: TUser): Promise<void> {
    user.accessFailedCount = (user.accessFailedCount ?? 0) + 1;
  }

  async resetAccessFailedCountAsync(user: TUser): Promise<void> {
    user.accessFailedCount = 0;
  }

  async getAccessFailedCountAsync(user: TUser): Promise<number> {
    return user.accessFailedCount ?? 0;
  }

  async setLockoutEnabledAsync(user: TUser, enabled: boolean): Promise<void> {
    user.lockoutEnabled = enabled;
  }

  async getLockoutEnabledAsync(user: TUser): Promise<boolean> {
    return user.lockoutEnabled ?? false;
  }

  async setLockoutEndDateAsync(user: TUser, date: Date | null): Promise<void> {
    user.lockoutEnd = date;
  }

  async getLockoutEndDateAsync(user: TUser): Promise<Date | null> {
    return user.lockoutEnd ?? null;
  }

  // -----------------------------
  // Two-Factor Authentication
  // -----------------------------

  async setTwoFactorEnabledAsync(user: TUser, enabled: boolean): Promise<void> {
    user.twoFactorEnabled = enabled;
  }

  async getTwoFactorEnabledAsync(user: TUser): Promise<boolean> {
    return user.twoFactorEnabled ?? false;
  }

  // -----------------------------
  // Security Stamp
  // -----------------------------

  async updateSecurityStampAsync(user: TUser): Promise<void> {
    user.securityStamp = randomUUID();
  }

  async getSecurityStampAsync(user: TUser): Promise<string | null> {
    return user.securityStamp ?? null;
  }

  // -----------------------------
  // Utility
  // -----------------------------

  async generateConcurrencyStampAsync(user: TUser): Promise<string> {
    return randomUUID();
  }

  normalizeName(name: string | null): string | null {
    return name ? name.toUpperCase() : null;
  }

  normalizeEmail(email: string | null): string | null {
    return email ? email.toLowerCase() : null;
  }

  async updateNormalizedUserNameAsync(user: TUser): Promise<void> {
    const normalized = this.normalizeName(user.userName);
    user.userName = normalized ?? user.userName;
    await this.store.update(user);
  }

  async updateNormalizedEmailAsync(user: TUser): Promise<void> {
    const normalized = this.normalizeEmail(user.email ?? null);
    user.email = normalized ?? user.email;
    await this.store.update(user);
  }

  // -----------------------------
  // Token Management (Reset, Email Confirmation, etc.)
  // -----------------------------

  /**
   * Generates a reset password token for the specified user.
   * In a real implementation, this would use a token provider.
   */
  async generatePasswordResetTokenAsync(user: TUser): Promise<string> {
    return randomUUID();
  }

  /**
   * Generates an email confirmation token for the specified user.
   */
  async generateEmailConfirmationTokenAsync(user: TUser): Promise<string> {
    return randomUUID();
  }

  /**
   * Verifies a reset password token.
   */
  async verifyPasswordResetTokenAsync(user: TUser, token: string): Promise<boolean> {
    // Simplified: just check if token matches securityStamp
    return user.securityStamp === token;
  }

  /**
   * Verifies an email confirmation token.
   */
  async verifyEmailConfirmationTokenAsync(user: TUser, token: string): Promise<boolean> {
    return user.securityStamp === token;
  }

  // -----------------------------
  // Phone Number Management
  // -----------------------------

  /**
   * Sets the phone number for the specified user.
   */
  async setPhoneNumberAsync(user: TUser, phoneNumber: string): Promise<IdentityResult> {
    try {
      user.phoneNumber = phoneNumber;
      user.phoneNumberConfirmed = false;
      await this.store.update(user);
      return IdentityResult.success();
    } catch (err: any) {
      return IdentityResult.failed([new IdentityError("SetPhoneNumberFailed", err.message)]);
    }
  }

  /**
   * Gets the phone number for the specified user.
   */
  async getPhoneNumberAsync(user: TUser): Promise<string | null> {
    return user.phoneNumber ?? null;
  }

  /**
   * Confirms the phone number for the specified user.
   */
  async confirmPhoneNumberAsync(user: TUser): Promise<IdentityResult> {
    if (!user.phoneNumber) {
      return IdentityResult.failed([new IdentityError("Invalid", "User has no phone number")]);
    }
    user.phoneNumberConfirmed = true;
    await this.store.update(user);
    return IdentityResult.success();
  }

  // -----------------------------
  // External Login Management
  // -----------------------------

  /**
   * Adds an external login (e.g., Google, Facebook) for the specified user.
   */
  async addLoginAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult> {
    if (!user.logins) user.logins = [];
    user.logins.push({ loginProvider, providerKey });
    return IdentityResult.success();
  }

  /**
   * Removes an external login for the specified user.
   */
  async removeLoginAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult> {
    if (!user.logins) return IdentityResult.failed([new IdentityError("Invalid", "User has no logins")]);
    user.logins = user.logins.filter((l: any) => !(l.loginProvider === loginProvider && l.providerKey === providerKey));
    return IdentityResult.success();
  }

  /**
   * Gets external logins for the specified user.
   */
  async getLoginsAsync(user: TUser): Promise<any[]> {
    return user.logins ?? [];
  }

  // -----------------------------
  // Recovery Codes (Two-Factor)
  // -----------------------------

  /**
   * Generates recovery codes for two-factor authentication.
   */
  async generateRecoveryCodesAsync(user: TUser, numberOfCodes: number): Promise<string[]> {
    const codes = Array.from({ length: numberOfCodes }, () => randomUUID().slice(0, 8));
    user.recoveryCodes = codes;
    return codes;
  }

  /**
   * Redeems a recovery code.
   */
  async redeemRecoveryCodeAsync(user: TUser, code: string): Promise<boolean> {
    const codes: string[] = user.recoveryCodes ?? [];
    const idx = codes.indexOf(code);
    if (idx === -1) return false;
    codes.splice(idx, 1);
    user.recoveryCodes = codes;
    return true;
  }

  /**
   * Gets remaining recovery codes.
   */
  async getRecoveryCodesAsync(user: TUser): Promise<string[]> {
    return user.recoveryCodes ?? [];
  }

  // -----------------------------
  // Sign-In & Lockout Helpers
  // -----------------------------

  /**
   * Determines whether the specified user is locked out.
   */
  async isLockedOutAsync(user: TUser): Promise<boolean> {
    if (!user.lockoutEnabled) return false;
    if (!user.lockoutEnd) return false;
    return user.lockoutEnd > new Date();
  }

  /**
   * Determines whether the specified user can sign in.
   * Checks lockout and other conditions.
   */
  async canSignInAsync(user: TUser): Promise<boolean> {
    if (await this.isLockedOutAsync(user)) return false;
    return true;
  }

  /**
   * Increments access failed count and locks out if threshold reached.
   */
  async accessFailedAndLockoutAsync(user: TUser, maxFailedAccessAttempts: number): Promise<void> {
    user.accessFailedCount = (user.accessFailedCount ?? 0) + 1;
    if (user.accessFailedCount >= maxFailedAccessAttempts) {
      user.lockoutEnd = new Date(Date.now() + 1000 * 60 * 15); // lockout for 15 minutes
    }
  }

  /**
   * Clears lockout state for the specified user.
   */
  async clearLockoutAsync(user: TUser): Promise<void> {
    user.accessFailedCount = 0;
    user.lockoutEnd = null;
  }

  // -----------------------------
  // User Status & Lifecycle
  // -----------------------------

  /**
   * Checks if the user has a confirmed email.
   */
  async isEmailConfirmedAsync(user: TUser): Promise<boolean> {
    return !!user.email; // simplified; real implementation would track confirmation flag
  }

  /**
   * Checks if the user has a confirmed phone number.
   */
  async isPhoneNumberConfirmedAsync(user: TUser): Promise<boolean> {
    return !!user.phoneNumberConfirmed;
  }

  /**
   * Checks if the user has a password set.
   */
  async hasPasswordAsync(user: TUser): Promise<boolean> {
    return !!user.passwordHash;
  }

  /**
   * Refreshes the user's sign-in by updating the security stamp.
   */
  async refreshSignInAsync(user: TUser): Promise<void> {
    await this.updateSecurityStampAsync(user);
    user.isSignedIn = true;
  }

  // -----------------------------
  // Advanced Role Helpers
  // -----------------------------

  /**
   * Gets all users in any of the specified roles.
   */
  async getUsersInRolesAsync(users: TUser[], roles: string[]): Promise<TUser[]> {
    return users.filter(u => u.roles?.some(r => roles.includes(r)));
  }

  /**
   * Removes all roles from the specified user.
   */
  async clearRolesAsync(user: TUser): Promise<void> {
    user.roles = [];
  }

  // -----------------------------
  // Sign-In Lifecycle
  // -----------------------------

  /**
   * Signs in the specified user.
   * In a real implementation, this would issue a cookie or JWT.
   */
  async signInAsync(user: TUser): Promise<IdentityResult> {
    if (!await this.canSignInAsync(user)) {
      return IdentityResult.failed([new IdentityError("LockedOut", "User cannot sign in")]);
    }
    // Simplified: mark user as "signed in"
    user.isSignedIn = true;
    return IdentityResult.success();
  }

  /**
   * Signs out the specified user.
   */
  async signOutAsync(user: TUser): Promise<void> {
    user.isSignedIn = false;
  }

  /**
   * Checks if the user is currently signed in.
   */
  async isSignedInAsync(user: TUser): Promise<boolean> {
    return !!user.isSignedIn;
  }

  /**
   * Attempts to sign in with password.
   */
  async passwordSignInAsync(user: TUser, password: string): Promise<IdentityResult> {
    if (!await this.checkPasswordAsync(user, password)) {
      await this.accessFailedAsync(user);
      return IdentityResult.failed([new IdentityError("InvalidPassword", "Password sign-in failed")]);
    }
    return this.signInAsync(user);
  }

  /**
   * Attempts to sign in with recovery code.
   */
  async recoveryCodeSignInAsync(user: TUser, code: string): Promise<IdentityResult> {
    const redeemed = await this.redeemRecoveryCodeAsync(user, code);
    if (!redeemed) {
      return IdentityResult.failed([new IdentityError("InvalidCode", "Recovery code sign-in failed")]);
    }
    return this.signInAsync(user);
  }

  /**
   * Attempts to sign in with external login provider.
   */
  async externalLoginSignInAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult> {
    const logins = await this.getLoginsAsync(user);
    const match = logins.find(l => l.loginProvider === loginProvider && l.providerKey === providerKey);
    if (!match) {
      return IdentityResult.failed([new IdentityError("InvalidLogin", "External login not found")]);
    }
    return this.signInAsync(user);
  }
}
