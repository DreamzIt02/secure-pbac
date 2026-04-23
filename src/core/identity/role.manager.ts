import { Claim } from "../../claims/index.js";
import { IClaim } from "../../claims/types.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { IQueryable } from "../../linq/index.js";
import { IdentityRole } from "../types/index.js";
import { IdentityErrorDescriber } from "./identity.error.describer.js";
import { IdentityResult } from "./identity.result.js";

/**
 * Abstraction for managing roles in a persistence store.
 */
export interface IRoleManager<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> {
  // Queryable roles
  readonly roles: IQueryable<TRole>;
  readonly supportsQueryableRoles: boolean;
  readonly supportsRoleClaims: boolean;

  // CRUD operations
  createAsync(role: TRole): Promise<IdentityResult>;
  updateAsync(role: TRole): Promise<IdentityResult>;
  deleteAsync(role: TRole): Promise<IdentityResult>;

  // Lookup operations
  roleExistsAsync(roleName: string): Promise<boolean>;
  findByIdAsync(roleId: string): Promise<TRole | null>;
  findByNameAsync(roleName: string): Promise<TRole | null>;

  // Role name/id
  getRoleNameAsync(role: TRole): Promise<string | null>;
  setRoleNameAsync(role: TRole, name: string | null): Promise<IdentityResult>;
  getRoleIdAsync(role: TRole): Promise<string>;

  // Claims
  addClaimAsync(role: TRole, claim: Claim): Promise<IdentityResult>;
  removeClaimAsync(role: TRole, claim: Claim): Promise<IdentityResult>;
  getClaimsAsync(role: TRole): Promise<IClaim[]>;

  // Normalization
  normalizeKey(key: string | null): string | null;

  // Disposal
  dispose(): void;

  // Error describer
  errorDescriber: IdentityErrorDescriber;
}
