import { AuthorizeClaimTypeEnum, SiteClaim } from "../claims/index.js";
import { AuthorizationOptions, AuthorizationPolicyBuilder } from "../core/index.js";
import { GroupPolicy, IPolicy, PolicyEnum } from "../policies/index.js";
import { AuthorizeRoleEnum, SiteRole } from "../roles/index.js";

export abstract class AuthorizationExtensions {
    constructor(protected authOptions: AuthorizationOptions) { }
    
    addPolicyAuthorization(configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions): AuthorizationOptions {
        this.authOptions = typeof configureOptions === "function" 
                            ? configureOptions(this.authOptions) 
                            : this.authOptions;

        const authPolicies = this.getPolicyAuthorization();
        
        for (let i = 0; i < authPolicies.length; i++) {
            const policyAuth = authPolicies[i];
            this.authOptions.addPolicy(policyAuth.name, builder => {
                // Add authentication scheme
                builder.addAuthenticationSchemes();

                if (policyAuth.requiredRoles)
                    builder.requireRole(...policyAuth.requiredRoles)
                if (policyAuth.requiredClaims)
                    builder.requireClaim(policyAuth.requiredClaims.type, policyAuth.requiredClaims.values);

            }, AuthorizationPolicyBuilder)
        }

        return this.authOptions;
    }

    private getPolicyAuthorization(): IPolicy[] {
        return [
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteAdmin),
                requiredRoles: [SiteRole.DefaultRole],
            },
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteActingAdmin),
                requiredRoles: [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeActingAdmin)],
            },
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteGeneralAdmin),
                requiredRoles: [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeGeneralAdmin)],
            },
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteDepartmentAdmin),
                requiredRoles: [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeDepartmentAdmin)],
                requiredClaims: { type: SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department) },
            },
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteManager),
                requiredRoles: [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager)],
                requiredClaims: { type: SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department) },
            },
            {
                name: GroupPolicy.authorizePolicyName(PolicyEnum.SiteSignedUser),
                requiredClaims: { type: SiteClaim.SignInClaimType },
            },
        ];
    }
}
