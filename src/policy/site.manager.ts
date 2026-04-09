// site-manager.ts

import { AuthorizeClaimEnum, AuthorizeClaimPriorityEnum, Claim, SiteClaim } from "../claims/index.js";
import { IdentityUser } from "../core/types/index.js";

export interface ISiteUser extends IdentityUser { }

export class PriorManagers<T extends ISiteUser = ISiteUser> {
  A: T[] = [];
  B: T[] = [];
  C: T[] = [];
  D: T[] = [];
  E: T[] = [];
  /** All managers */
  Z: T[] = [];
}

export class SiteManager {
  static priorManagerClaimType(issuer: AuthorizeClaimEnum): string {
    return `preferred_${SiteClaim.authorizeClaimName(issuer)}`;
  }

  static priorManagerClaimValue(priority: AuthorizeClaimPriorityEnum): number {
    return priority as number;
  }

  static priorManagerLog(manager: string, name?: string): string {
    return `Admin user '${manager}' signed in as Manager${
      name?.trim() ? ` of '${name}'` : ''
    }`;
  }

  static priorManagerResetLog(manager: string, name?: string): string {
    return `Admin user '${manager}' signed out as Manager${
      name?.trim() ? ` of '${name}'` : ''
    }`;
  }

  /**
   * Selection logic (ported from C#)
   */
  static select<T extends ISiteUser>(
    managers: PriorManagers<T>,
    total: number,
    solved: number
  ): [T, boolean] {
    const pick = (list: T[], solved: number, total: number): T | null => {
      const count = list.length;
      if (count === 0 || solved >= count) return null;

      if (total >= count) {
        return list[solved];
      }

      return list[Math.floor(Math.random() * count)];
    };

    const process = (list: T[]): T | null => {
      const count = list.length;
      const result = pick(list, solved, total);

      total -= count;
      solved -= count;
      if (solved < 0) solved = 0;

      return result;
    };

    let result: T | null;

    if ((result = process(managers.A))) return [result, false];
    if ((result = process(managers.B))) return [result, false];
    if ((result = process(managers.C))) return [result, false];
    if ((result = process(managers.D))) return [result, false];
    if ((result = process(managers.E))) return [result, false];

    // fallback (Z group - always random)
    const zCount = managers.Z.length;
    if (zCount === 0) {
      throw new Error('No managers available for selection');
    }

    return [managers.Z[Math.floor(Math.random() * zCount)], true];
  }

  static priorityClaim(
    provider: AuthorizeClaimEnum,
    value?: AuthorizeClaimPriorityEnum | null
  ): Claim {
    return new Claim(this.priorManagerClaimType(provider), value == null ? '' : String(value));
  }
}
