import { PolicyEnum } from '../policies/index.js';
import { Claim, AuthorizeClaimEnum, SiteClaim } from '../claims/index.js';
import { AuthorizeRoleEnum, SiteRole } from '../roles/index.js';
import { AuthorizationResult, IUser } from '../types/index.js';

interface User extends IUser<AuthorizeRoleEnum, Claim> { }

// Interface extracted from C# IPolicyAuthorizeService
export interface IPolicyAuthorizeService {
  authorizeAsync(user: User, policies: PolicyEnum[], checkDefault?: boolean): Promise<AuthorizationResult>;
  authorizePolicy(user: User, policy: PolicyEnum): Promise<AuthorizationResult>;

  isDefaultAdmin(user: User): Promise<AuthorizationResult>;
  isActingAdmin(user: User): Promise<AuthorizationResult>;
  isGeneralAdmin(user: User): Promise<AuthorizationResult>;
  isDepartmentAdmin(user: User, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
  isDepartmentManager(user: User, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;

  isInAdminGroup(user: User): Promise<boolean>;
  forbiddenAdminGroup(user: User): Promise<boolean>;
  authorizeAdminGroup(user: User): Promise<boolean>;
  authorizeManagerGroup(user: User): Promise<boolean>;
}

// Implementation
export class PolicyAuthorizeService implements IPolicyAuthorizeService {
  async authorizeAsync(user: User, policies: PolicyEnum[], checkDefault = false): Promise<AuthorizationResult> {
    if (checkDefault) {
      const result = await this.isDefaultAdmin(user);
      if (result.succeeded) return result;
    }

    for (const policy of policies) {
      if (policy !== PolicyEnum.SiteAdmin) {
        const result = await this.authorizePolicy(user, policy);
        if (result.succeeded) return result;
      }
    }
    return { succeeded: false };
  }

  async authorizePolicy(user: User, policy: PolicyEnum): Promise<AuthorizationResult> {
    const hasClaim = user.claims?.some(c => c.value.toLowerCase() === PolicyEnum[policy].toLowerCase());
    return { succeeded: hasClaim };
  }

  async isDefaultAdmin(user: User): Promise<AuthorizationResult> {
    const isDefault = user.roles.includes(AuthorizeRoleEnum.Default);
    return { succeeded: isDefault };
  }

  async isActingAdmin(user: User): Promise<AuthorizationResult> {
    const isActing = user.roles.includes(AuthorizeRoleEnum.AuthorizeActingAdmin);
    return { succeeded: isActing };
  }

  async isGeneralAdmin(user: User): Promise<AuthorizationResult> {
    const isGeneral = user.roles.includes(AuthorizeRoleEnum.AuthorizeGeneralAdmin);
    return { succeeded: isGeneral };
  }

  async isDepartmentAdmin(user: User, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult> {
    const isDeptAdmin = user.roles.includes(AuthorizeRoleEnum.AuthorizeDepartmentAdmin);
    if (!claim) return { succeeded: isDeptAdmin };

    const expectedClaim = SiteClaim.newClaim(claim);
    const hasClaim = expectedClaim
      ? user.claims.some(c => SiteClaim.isTypeEqual(c.type, expectedClaim.type) && SiteClaim.isValueEqual(c.value, expectedClaim.value))
      : false;

    return { succeeded: isDeptAdmin && hasClaim };
  }

  async isDepartmentManager(user: User, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult> {
    const isManager = user.roles.includes(AuthorizeRoleEnum.AuthorizeManager);
    if (!claim) return { succeeded: isManager };

    const expectedClaim = SiteClaim.newClaim(claim);
    const hasClaim = expectedClaim
      ? user.claims.some(c => SiteClaim.isTypeEqual(c.type, expectedClaim.type) && SiteClaim.isValueEqual(c.value, expectedClaim.value))
      : false;

    return { succeeded: isManager && hasClaim };
  }

  async isInAdminGroup(user: User): Promise<boolean> {
    return user.roles.some(r => SiteRole.AdminRoles.includes(r));
  }

  async forbiddenAdminGroup(user: User): Promise<boolean> {
    const defaultAdmin = await this.isDefaultAdmin(user);
    const actingAdmin = await this.isActingAdmin(user);
    const generalAdmin = await this.isGeneralAdmin(user);
    return defaultAdmin.succeeded || actingAdmin.succeeded || generalAdmin.succeeded;
  }

  async authorizeAdminGroup(user: User): Promise<boolean> {
    const defaultAdmin = await this.isDefaultAdmin(user);
    if (defaultAdmin.succeeded) return true;
    const actingAdmin = await this.isActingAdmin(user);
    if (actingAdmin.succeeded) return true;
    const deptAdmin = await this.isDepartmentAdmin(user);
    return deptAdmin.succeeded;
  }

  async authorizeManagerGroup(user: User): Promise<boolean> {
    const manager = await this.isDepartmentManager(user);
    return manager.succeeded;
  }
}
