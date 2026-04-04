
export interface IClaim {
    type: string, value: string
}
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