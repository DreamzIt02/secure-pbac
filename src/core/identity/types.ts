import { IClaim } from "../../claims/types.js";

/**
 * Represents a user in the system.
 */
export interface IUser<TClaim = IClaim> {
  id: string;
  userName: string;
  email?: string;
  passwordHash?: string;
  claims?: TClaim[];
  roles?: string[];
  accessFailedCount?: number;
  lockoutEnd?: Date | null;
  lockoutEnabled?: boolean;
  twoFactorEnabled?: boolean;
  securityStamp?: string;
}

/**
 * Interface describing the shape of IdentityError.
 * Mirrors Microsoft.AspNetCore.Identity.IdentityError contract (simplified).
 */
export interface IIdentityError {
  code: string;
  description: string;
}

/**
 * Interface describing the shape of IdentityResult.
 * Mirrors Microsoft.AspNetCore.Identity.IdentityResult contract (simplified).
 */
export interface IIdentityResult {
  succeeded: boolean;
  errors: IIdentityError[];

  toString(): string;
}