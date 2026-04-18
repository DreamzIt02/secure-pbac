import { TOKENS } from "../App.tokens.js";
import { AuthorizeClaimEnum, AuthorizeClaimTypeEnum, ClaimsPrincipal, SiteClaim } from "../claims/index.js";
import { AllowedPrimaryKeysSafe } from "../contexts/index.js";
import { UserClaimsPrincipalFactory } from "../core/extensions/index.js";
import { RoleManager } from "../core/identity/index.js";
import { AuthorizationResult, IAuthorizationService } from "../core/index.js";
import { IdentityOptions } from "../core/options/index.js";
import { IdentityRole, IdentityUser } from "../core/types/index.js";
import { Inject } from "../decorators/index.js";
import { GroupPolicy, PolicyEnum } from "../policies/index.js";
import { AuthorizeRoleEnum, SiteRole } from "../roles/index.js";
import { IManagerInfo, IOptions } from "../types/index.js";
import { UserManager1 } from "./identity/index.js";
import { IPolicyAuthorizationService } from "./policy.authorization.service.js";

export class DefaultPolicyAuthorizationService<
    TKey  extends AllowedPrimaryKeysSafe, 
    TUser extends IdentityUser<TKey> = IdentityUser<TKey>, 
    TRole extends IdentityRole<TKey> = IdentityRole<TKey>> implements IPolicyAuthorizationService<TKey, TUser> {
    constructor(
        @Inject(TOKENS.AUTHORIZATION_SERVICE) private readonly authService: IAuthorizationService,
        @Inject(TOKENS.USER_MANAGER1) private readonly userManager        : UserManager1<TKey, TUser>,
        @Inject(TOKENS.ROLE_MANAGER)  private readonly roleManager        : RoleManager<TKey, TRole>,
        private readonly options                                          : IOptions<IdentityOptions>,
    ) {
    }
    authorizeAsync(User: ClaimsPrincipal, policies: PolicyEnum[], checkDefault: boolean): Promise<AuthorizationResult>;
    authorizeAsync(User: ClaimsPrincipal, policies: PolicyEnum[]): Promise<AuthorizationResult>;
    authorizeAsync(User: ClaimsPrincipal, policy: PolicyEnum): Promise<AuthorizationResult>;
    async authorizeAsync(User: ClaimsPrincipal, policies: PolicyEnum | PolicyEnum[], checkDefault?: boolean): Promise<AuthorizationResult> {
        let _authorized = AuthorizationResult.failedDefault();

        if (checkDefault) {
            _authorized = await this.isDefaultAdmin(User);

            if (_authorized.succeeded)
                return _authorized;
        }
        if (Array.isArray(policies)) {
            for (let i = 0; i < policies.length; i++) {
                const policy = policies[i];
                /// <summary>
                /// Try to Authorize with any Policy from the list
                /// </summary>
                if (policy != PolicyEnum.SiteAdmin)
                    _authorized = await this.authorizeAsync(User, policy);
                if (_authorized.succeeded)
                    break;
            }
            return _authorized;
        }
        return this.authService.authorizeAsync(User, null, GroupPolicy.authorizePolicyName(policies as PolicyEnum));
    }

    isDefaultAdmin(User: ClaimsPrincipal): Promise<AuthorizationResult>;
    isDefaultAdmin(user: TUser): Promise<AuthorizationResult>;
    async isDefaultAdmin(User: ClaimsPrincipal | TUser): Promise<AuthorizationResult> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);
        return this.authService.authorizeAsync(User , null, GroupPolicy.authorizePolicyName(PolicyEnum.SiteAdmin));
    }
    isActingAdmin(User: ClaimsPrincipal): Promise<AuthorizationResult>;
    isActingAdmin(user: TUser): Promise<AuthorizationResult>;
    async isActingAdmin(User: ClaimsPrincipal | TUser): Promise<AuthorizationResult> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);
        return this.authService.authorizeAsync(User , null, GroupPolicy.authorizePolicyName(PolicyEnum.SiteActingAdmin));
    }
    isGeneralAdmin(User: ClaimsPrincipal): Promise<AuthorizationResult>;
    isGeneralAdmin(user: TUser): Promise<AuthorizationResult>;
    async isGeneralAdmin(User: ClaimsPrincipal | TUser): Promise<AuthorizationResult> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);
        return this.authService.authorizeAsync(User , null, GroupPolicy.authorizePolicyName(PolicyEnum.SiteGeneralAdmin));
    }
    isDepartmentAdmin(User: ClaimsPrincipal, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
    isDepartmentAdmin(user: TUser, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
    async isDepartmentAdmin(User: ClaimsPrincipal | TUser, department?: AuthorizeClaimEnum): Promise<AuthorizationResult> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);

        if (department == null || 
            User.hasClaim(c => 
                SiteClaim.isTypeEqual(c.type, SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department)) 
                && 
                SiteClaim.isValueEqual(c.value, SiteClaim.authorizeClaimName(department)))
            ) {
            return this.authService.authorizeAsync(User, null, GroupPolicy.authorizePolicyName(PolicyEnum.SiteDepartmentAdmin));
        }

        return AuthorizationResult.failedDefault();
    }
    isDepartmentManager(User: ClaimsPrincipal, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
    isDepartmentManager(user: TUser, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
    async isDepartmentManager(User: ClaimsPrincipal | TUser, department?: AuthorizeClaimEnum): Promise<AuthorizationResult> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);

        if (department == null || 
            User.hasClaim(c => 
                SiteClaim.isTypeEqual(c.type, SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department))
                && 
                SiteClaim.isValueEqual(c.value, SiteClaim.authorizeClaimName(department)))
            ) {
            return this.authService.authorizeAsync(User, null, GroupPolicy.authorizePolicyName(PolicyEnum.SiteManager));
        }

        return AuthorizationResult.failedDefault();
    }
    isInAdminGroup(User: ClaimsPrincipal): Promise<boolean>;
    isInAdminGroup(user: TUser): Promise<boolean>;
    async isInAdminGroup(User: ClaimsPrincipal | TUser): Promise<boolean> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);
                
        for (const role in SiteRole.AdminRoleNames)
        {
            if (User.isInRole( role )) {
                return Promise.resolve(true);
            }
        }
        return Promise.resolve(false);
    }
    forbiddenAdminGroup(User: ClaimsPrincipal): Promise<boolean>;
    forbiddenAdminGroup(user: TUser): Promise<boolean>;
    async forbiddenAdminGroup(User: ClaimsPrincipal | TUser): Promise<boolean> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);

        let result = await this.isDefaultAdmin(User); 
        if (!result.succeeded)
        {
            result = await this.isActingAdmin(User);
            if (!result.succeeded)
            {
                result = await this.isGeneralAdmin(User);
            }
        }
        return result.succeeded;
    }
    authorizeAdminGroup(User: ClaimsPrincipal): Promise<boolean>;
    authorizeAdminGroup(user: TUser): Promise<boolean>;
    async authorizeAdminGroup(User: ClaimsPrincipal | TUser): Promise<boolean> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);

        let result = await this.isDefaultAdmin(User);
        if (!result.succeeded)
            result = await this.isActingAdmin(User);
        if (!result.succeeded)
            result = await this.isDepartmentAdmin(User, undefined);

        return result.succeeded;
    }
    authorizeManagerGroup(User: ClaimsPrincipal): Promise<boolean>;
    authorizeManagerGroup(user: TUser): Promise<boolean>;
    async authorizeManagerGroup(User: ClaimsPrincipal | TUser): Promise<boolean> {
        if (!(User instanceof ClaimsPrincipal))
            User = await new UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>(
                this.userManager, this.roleManager, this.options).createAsync(User);
        
        let result = await this.isDepartmentManager(User, undefined);
        return result.succeeded;
    }

    async getDefaultAdmin(): Promise<TUser> {
        let roleName = SiteRole.DefaultRole;
        let admins = await this.userManager.getUsersInRoleAsync(roleName);
        return Promise.resolve(admins?.at(0) ?? null as any);
    }

    async getActingAdmin(): Promise<TUser> {
        let roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeActingAdmin);
        let admins = await this.userManager.getUsersInRoleAsync(roleName);
        let admin = admins?.at(0) ?? null as any;
        if (admin != null)
        {
            let result = await this.isActingAdmin(admin);
            if (result.succeeded)
            {
                return Promise.resolve(admin);
            }

        }
        return Promise.resolve(null as any);
    }
    async getGeneralAdmin(): Promise<TUser> {
        let roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeGeneralAdmin);
        let admins = await this.userManager.getUsersInRoleAsync(roleName);
        let admin = admins?.at(0) ?? null as any;
        if (admin != null)
        {
            let result = await this.isGeneralAdmin(admin);
            if (result.succeeded)
            {
                return Promise.resolve(admin);
            }

        }
        return Promise.resolve(null as any);
    }
    async getDepartmentAdmin(department: AuthorizeClaimEnum): Promise<TUser> {
        let roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeDepartmentAdmin);
        let admins = await this.userManager.getUsersInRoleAsync(roleName);
        let admin = admins?.at(0) ?? null as any;
        if (admin != null)
        {
            let result = await this.isDepartmentAdmin(admin, department);
            if (result.succeeded)
            {
                return Promise.resolve(admin);
            }

        }
        return Promise.resolve(null as any);
    }
    async getDepartmentAdmins(departments: AuthorizeClaimEnum[]): Promise<TUser[]> {
        let roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeDepartmentAdmin);
        let roleUsers = await this.userManager.getUsersInRoleAsync(roleName);
        let admins: TUser[] | null = null;
        if (roleUsers != null)
        {
            admins = [];
            for (let ru of roleUsers)
            {
                for (let department of departments)
                {
                    let result = await this.isDepartmentAdmin(ru, department);
                    if (result.succeeded)
                    {
                        admins.push(ru);
                    }
                }
            }
            
        }
        return Promise.resolve(admins ?? null as any);
    }
    async getDepartmentManagers(department: AuthorizeClaimEnum): Promise<TUser[]> {
        let roleName = SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager);
        let roleUsers = await this.userManager.getUsersInRoleAsync(roleName);
        let managers: TUser[] | null = null;
        if (roleUsers != null)
        {
            managers = [];
            for (let ru of roleUsers)
            {
                let result = await this.isDepartmentManager(ru, department);
                if (result.succeeded)
                {
                    managers.push(ru);
                }
            }
        }
        return Promise.resolve(managers ?? null as any);
    }
    async getValidManager(item: IManagerInfo, department?: AuthorizeClaimEnum): Promise<TUser> {
        /// <summary>
        /// Check existing valid Manager
        /// </summary>
        if (!(item.manager === undefined || item.manager === null || item.manager === ''))
        {
            let manager = await this.userManager.findByNameAsync(item.manager);
            if (manager != null)
            { 
                // Is Manager
                let isManager = await this.isDepartmentManager(manager, department);
                if (isManager.succeeded)
                {
                    return Promise.resolve(manager);
                }
            }
        }
        return Promise.resolve(null as any);
    }
    async hasValidManager(item: IManagerInfo, department?: AuthorizeClaimEnum): Promise<boolean> {
        /// <summary>
        /// Check existing valid Manager
        /// </summary>
        if (!(item.manager === undefined || item.manager === null || item.manager === ''))
        {
            let manager = await this.userManager.findByNameAsync(item.manager);
            if (manager != null)
            { 
                // Is Manager
                let isManager = await this.isDepartmentManager(manager, department);
                if (isManager.succeeded)
                {
                    return Promise.resolve(true);
                }
            }
        }
        return Promise.resolve(false);
    }
}