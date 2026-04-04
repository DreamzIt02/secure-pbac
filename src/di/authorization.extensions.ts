import { PolicyEnum, GroupPolicy } from '../policies/index.js';
import { AuthorizeRoleEnum, SiteRole } from '../roles/index.js';
import { AuthorizeClaimTypeEnum, SiteClaim } from '../claims/index.js';

export interface Policy {
  name: string;
  requiredRoles?: string[];
  requiredClaims?: { type: string; values?: string[] };
}

export class AuthorizationExtensions {
  static addPolicyAuthorization(): Policy[] {
    return [
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteAdmin),
        requiredRoles: [SiteRole.DefaultRole],
      },
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteActingAdmin),
        requiredRoles: [SiteRole.AuthorizeRoleName(AuthorizeRoleEnum.AuthorizeActingAdmin)],
      },
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteGeneralAdmin),
        requiredRoles: [SiteRole.AuthorizeRoleName(AuthorizeRoleEnum.AuthorizeGeneralAdmin)],
      },
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteDepartmentAdmin),
        requiredRoles: [SiteRole.AuthorizeRoleName(AuthorizeRoleEnum.AuthorizeDepartmentAdmin)],
        requiredClaims: { type: SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department) },
      },
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteManager),
        requiredRoles: [SiteRole.AuthorizeRoleName(AuthorizeRoleEnum.AuthorizeManager)],
        requiredClaims: { type: SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department) },
      },
      {
        name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteSignedUser),
        requiredClaims: { type: SiteClaim.SignInClaimType, values: [] },
      },
    ];
  }
}
