import { Claim, SiteClaim } from '../claims/index.js';
import { AuthorizeClaimEnum, AuthorizeClaimTypeEnum, AuthorizeClaimPriorityEnum } from '../claims/index.js';
import { User as IdentityUser, UserManager } from '../core/identity/index.js';
import { IdentityResult } from '../types/index.js';
import { PriorManagers, SiteManager } from './site.manager.js';

export interface IUser extends IdentityUser {

}

export class UserManager1 {
  constructor(private manager: UserManager<IdentityUser>) {}

  async hasClaimAsync(user: IUser, claim: Claim): Promise<boolean> {
    if (!user) return false;
    const claims = await this.manager.getClaimsAsync(user);
    return claims?.some(c => c.type === claim.type && c.value === claim.value);
  }

  async hasSignInClaimAsync(sessionClaims: Claim[], dbUser: IUser | null): Promise<boolean> {
    if (!dbUser) return true; // allow anonymous

    const claims = await this.manager.getClaimsAsync(dbUser);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    if (!claim) return false;

    // Compare DB claim vs. session claims
    return sessionClaims?.some(c => c.type === claim.type && c.value === claim.value);
  }

  async addSignInClaimAsync(user: IUser): Promise<IdentityResult> {
    if (!user) {
      return { succeeded: false, errors: [{ code: 'Invalid', description: `Failed to add ${SiteClaim.SignInClaimType} claim` }] };
    }
    const claims = await this.manager.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    if (!claim) {
      return this.manager.addClaimAsync(user, SiteClaim.newSignInClaim());
    }
    return { succeeded: true };
  }

  async updateSignInClaimAsync(user: IUser): Promise<IdentityResult> {
    if (!user) {
      return { succeeded: false, errors: [{ code: 'Invalid', description: `Failed to update ${SiteClaim.SignInClaimType} claim` }] };
    }
    const claims = await this.manager.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    const newClaim = SiteClaim.newSignInClaim();
    if (!claim) {
      return this.manager.addClaimAsync(user, newClaim);
    } else {
      return this.manager.replaceClaimAsync(user, claim, newClaim);
    }
  }

  async getDepartmentAsync(user: IUser): Promise<AuthorizeClaimEnum | null> {
    const claimType = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    const claims = await this.manager.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === claimType);
    if (!claim || !claim.value) return null;
    const parsed = parseInt(claim.value, 10);
    return isNaN(parsed) ? null : (parsed as AuthorizeClaimEnum);
  }

  async getPriorityAsync(user: IUser, provider: AuthorizeClaimEnum): Promise<number> {
    const claim = SiteManager.priorityClaim(provider, null);
    const claims = await this.manager.getClaimsAsync(user);
    const found = claims?.find(c => c.type === claim.type);
    return found ? parseInt(found.value || '0', 10) || 0 : 0;
  }

  async priorManagerResolve(provider: AuthorizeClaimEnum, managers: IUser[]): Promise<PriorManagers<IUser>> {
    const claimType = SiteManager.priorManagerClaimType(provider);
    const result = new PriorManagers<IUser>();
    for (const user of managers) {
      if (await this.hasClaimAsync(user, { type: claimType, value: String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.A)) })) {
        result.A.push(user);
      } else if (
          await this.hasClaimAsync(user, { type: claimType, value: String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.B)) })) {
        result.B.push(user);
      } else if (
          await this.hasClaimAsync(user, { type: claimType, value: String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.C)) })) {
        result.C.push(user);
      } else if (
          await this.hasClaimAsync(user, { type: claimType, value: String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.D)) })) {
        result.D.push(user);
      } else if (
          await this.hasClaimAsync(user, { type: claimType, value: String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.E)) })) {
        result.E.push(user);
      }
      result.Z.push(user);
    }
    return result;
  }
}
