import { Claim, ClaimsPrincipal } from "../../claims/index.js";
import { IClaim } from "../../claims/types.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { IdentityOptions } from "../options/index.js";
import { IdentityUser, UserLoginInfo } from "../types/index.js";
import { IdentityResult } from "./identity.result.js";

// IUserManager.ts
export interface IUserManager<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> {
  options: IdentityOptions;
  
  // Basic store operations
  createAsync(user: TUser): Promise<IdentityResult>;
  updateAsync(user: TUser): Promise<IdentityResult>;
  deleteAsync(user: TUser): Promise<IdentityResult>;
  findByIdAsync(userId: string): Promise<TUser | null>;
  findByNameAsync(userName: string): Promise<TUser | null>;

  // User name and ID
  getUserNameAsync(user: TUser): Promise<string | null>;
  setUserNameAsync(user: TUser, userName: string | null): Promise<IdentityResult>;
  getUserIdAsync(user: TUser): Promise<string>;

  // Claims
  addClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult>;
  addClaimsAsync(user: TUser, claims: Claim[]): Promise<IdentityResult>;
  replaceClaimAsync(user: TUser, claim: Claim, newClaim: Claim): Promise<IdentityResult>;
  removeClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult>;
  removeClaimsAsync(user: TUser, claims: Claim[]): Promise<IdentityResult>;
  getClaimsAsync(user: TUser): Promise<IClaim[]>;

  // Roles
  addToRoleAsync(user: TUser, role: string): Promise<IdentityResult>;
  addToRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult>;
  removeFromRoleAsync(user: TUser, role: string): Promise<IdentityResult>;
  removeFromRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult>;

  // Logins
  findByLoginAsync(loginProvider: string, providerKey: string): Promise<TUser | null>;
  removeLoginAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult>;
  addLoginAsync(user: TUser, login: UserLoginInfo): Promise<IdentityResult>;
  getLoginsAsync(user: TUser): Promise<UserLoginInfo[]>;

  // Security
  getSecurityStampAsync(user: TUser): Promise<string>;
  updateSecurityStampAsync(user: TUser): Promise<IdentityResult>;

  // Passwords
  hasPasswordAsync(user: TUser): Promise<boolean>;
  addPasswordAsync(user: TUser, password: string): Promise<IdentityResult>;
  changePasswordAsync(user: TUser, currentPassword: string, newPassword: string): Promise<IdentityResult>;
  removePasswordAsync(user: TUser): Promise<IdentityResult>;
  checkPasswordAsync(user: TUser, password: string): Promise<boolean>;

  // ClaimsPrincipal helpers
  getUserName(principal: ClaimsPrincipal): string | null;
  getUserId(principal: ClaimsPrincipal): string | null;
  getUserAsync(principal: ClaimsPrincipal): Promise<TUser | null>;

  /**
   * Gets the user, if any, associated with the normalized value of the specified email address.
   * @param email The email address to return the user for.
   * @returns A Promise containing the user, if any, associated with a normalized value of the specified email address.
   */
   findByEmailAsync(email: string): Promise<TUser | null>;
   /**
    * Gets the email address for the specified user.
    * @param user The user whose email should be returned.
    * @returns A Promise containing the email address for the specified user.
    */
    getEmailAsync(user: TUser): Promise<string | null>;
    /**
     * Gets a flag indicating whether the email address for the specified user has been verified.
     * @param user The user whose email confirmation status should be returned.
     * @returns A Promise containing true if the email address has been confirmed, otherwise false.
     */
    isEmailConfirmedAsync(user: TUser): Promise<boolean>;

    /**
     * Gets the telephone number, if any, for the specified user.
     * @param user The user whose telephone number should be retrieved.
     * @returns A Promise containing the user's telephone number, if any.
     */
    getPhoneNumberAsync(user: TUser): Promise<string | null>;

    /**
     * Gets a flag indicating whether the specified user's telephone number has been confirmed.
     * @param user The user to return a flag for.
     * @returns A Promise returning true if the specified user has a confirmed telephone number, otherwise false.
     */
    isPhoneNumberConfirmedAsync(user: TUser): Promise<boolean>;
}
