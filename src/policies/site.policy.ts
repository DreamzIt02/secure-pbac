import { Claim, ClaimsIdentity, ClaimsPrincipal, SiteClaim } from "../claims/index.js";
import { HttpContext } from "../http/index.js";
import { KeyValuePair, StringValues } from "../types/dictionary.js";

export type Policy = string;

export interface IPolicy {
  name: string;
  requiredRoles?: string[];
  requiredClaims?: { type: string; values?: Iterable<string> };
}

/**
 * 
 * PolicyEnum
 */
export enum PolicyEnum {
    /**
     * Exempt from Everything
     */
    SiteAdmin = 0,

    /**
     * Following TWO Exempt from Department Check inside of IActionResult
     */
    SiteActingAdmin = 1,

    /**
     * General Admin
     */
    SiteGeneralAdmin = 2,

    /**
     * Must check Department Claim inside of IActionResult
     */
    SiteDepartmentAdmin = 3,

    /**
     * Manager
     */
    SiteManager = 4,

    // [Display(Name = "Supervisor")]
    // SiteSupervisor = 15,
    // [Display(Name = "Team Leader")]
    // SiteTeamLeader = 16,

    /**
     * Signed User
     */
    SiteSignedUser = 101,

    /**
     * Unsigned User
     */
    SiteUnSignedUser = 102
}

/**
 * GroupPolicyEnum, contains the policies for particular Controller_Action, such as AccountController_Index.
 * 
 * Which represents the list of Policy applied for the IActionResult(Method).
 */
export enum GroupPolicyEnum {
    /**
     * Default policy is for 'SiteAdmin' 
     */
    Default = 0,

    // [Display(Name = "Team Leader")]
    // TeamLeader = 301,
    // [Display(Name = "Supervisor")]
    // Supervisor = 302,

    /**
     * Manager
     */
    Manager = 303,

    /**
     * Department Admin
     */
    DepartmentAdmin = 304,

    /**
     * General Admin
     */
    GeneralAdmin = 305,

    /**
     * Acting Admin (Alternate to Lnf Default Admin)
     */
    ActingAdmin = 306,

    /**
     * Signed User
     */
    SignedUser = 101
}

export class SitePolicy {
    
    public static isDefaultAdmin(policy: PolicyEnum): boolean {
        return policy === PolicyEnum.SiteAdmin   
    }

    public static isActingAdmin(policy: PolicyEnum): boolean {
        return policy === PolicyEnum.SiteActingAdmin   
    }

    public static isGeneraleAdmin(policy: PolicyEnum): boolean {
        return policy === PolicyEnum.SiteGeneralAdmin   
    }

}   

/**
 * While publishing to the hosting server, the password for the Default user is read from the AppSettings.
 * 
 * Which ensures, if somehow the site is compromised by an illicit user,
 * 
 * Then the default user can be re‑activated, when the default user is normally disabled after assigning 
 * 
 * `Acting Admin` and `General Admin`.
 */
export class GroupPolicy {
    public static GroupPolicies: GroupPolicyEnum[] = 
        Object.values(GroupPolicyEnum).filter((v) => typeof v === 'number') as GroupPolicyEnum[];

    public static AllPolicies: PolicyEnum[] = Object.values(PolicyEnum).filter((v) => typeof v === 'number') as PolicyEnum[];

    public static AdminPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter(
        (p) =>
            p !== PolicyEnum.SiteAdmin &&
            PolicyEnum[p].toLowerCase().includes('admin')
    );

    public static ManagerPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter((p) =>
        PolicyEnum[p].toLowerCase().includes('manager')
    );

    public static NonOrganizationPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter(
        (p) =>
            !PolicyEnum[p].toLowerCase().includes('admin') &&
            !PolicyEnum[p].toLowerCase().includes('manager')
    );
    
    /**
     * Gets the name of the given policy.
     * @param policy The policy.
     */
    public static authorizePolicyName(policy: PolicyEnum): string {
        return PolicyEnum[policy];
    }

    /**
     * Gets the group policy for the given GroupPolicyEnum.
     * @param id The group policy id.
     */
    public static getGroupPolicy(id: GroupPolicyEnum): PolicyEnum[] {
        switch (id) {
          case GroupPolicyEnum.Default:
            return [PolicyEnum.SiteAdmin];
          case GroupPolicyEnum.ActingAdmin:
            return [PolicyEnum.SiteActingAdmin];
          case GroupPolicyEnum.GeneralAdmin:
            return [PolicyEnum.SiteActingAdmin, PolicyEnum.SiteGeneralAdmin];
          case GroupPolicyEnum.DepartmentAdmin:
            return GroupPolicy.getComplexGroup(GroupPolicy.AdminPolicies, []);
          case GroupPolicyEnum.Manager:
            return GroupPolicy.getComplexGroup(GroupPolicy.AdminPolicies, GroupPolicy.ManagerPolicies);
          case GroupPolicyEnum.SignedUser:
            return [PolicyEnum.SiteSignedUser];
          default:
            return [];
        }
    }

    /**
     * Simply adds two arrays and returns as new array.
     * @param group1 First array.
     * @param group2 Second array.
     */
    public static getComplexGroup(group1: PolicyEnum[], group2: PolicyEnum[]): PolicyEnum[] {
        return [...group1, ...group2];
    }

    /**
     * Creates a policy claim for the given policy.
     * @param policy The policy.
     */
    public static requestPolicyClaim(policy: PolicyEnum): Claim {
        return new Claim('Policy', this.authorizePolicyName(policy));
    }

    /**
     * Creates a policy header attribute for the given policy name.
     * @param policy The policy.
     */
    public static requestPolicyHeader(policy: PolicyEnum): KeyValuePair<string, StringValues> {
        return { key: "Policy", value: this.authorizePolicyName(policy) };
    }

    /**
     * Add succeeded policy claim to the Request.User.
     * 
     * This policy claim is used for detecting the (Maximum Authorization / Position) of Context User.
     * @param context The HttpContext.
     * @param policy The policy.
     */
    public static addRequestPolicy(User: ClaimsPrincipal, policy: PolicyEnum): void {
        const claim = GroupPolicy.requestPolicyClaim(policy);
        const claimIdentity = new ClaimsIdentity();
            claimIdentity.addClaim(claim);
        User.addIdentity(claimIdentity);
    }

    private static _isRequestFromWho(context: HttpContext, policy: PolicyEnum): boolean {
        if (!context.request || !context.request.headers) return false;

        let result = false;
        const headerName = this.requestPolicyHeader(policy);
        // In Node.js, header keys are lowercase
        const headerValue = context.request.headers[headerName.key.toLowerCase()];
        if (headerValue)
        {
            // Node.js may give string or string[]
            result = Array.isArray(headerValue) 
                ? headerValue.includes(headerName.value.toString().toLowerCase())
                : headerValue === headerName.value.toString().toLowerCase();
        }
        if (result) 
            return true;

        const claim = GroupPolicy.requestPolicyClaim(policy);
        return context.user.hasClaim(c => SiteClaim.isTypeEqual(c.type, claim.type) && SiteClaim.isValueEqual(c.value, claim.value));
    }

    /**
     * Check if the policy name is DefaultAdmin.
     * 
     * This is used to find the Request Made By.
     * 
     * When PolicyAuthorizeAttribute applies to the Request,
     * A header is added to the Context.Request with `RequestPolicyHeader`.
     * 
     * The name of the Policy is the succeeded top‑most Policy for the User.
     */
    public static isRequestFromDefaultAdmin(context: HttpContext): boolean {
       return this._isRequestFromWho(context, PolicyEnum.SiteAdmin);
    }

    /// <summary>
    /// Check if the policy name is ActingAdmin
    /// 
    /// This is use to find the Request Made By
    /// 
    /// When PolicyAuthorizeAttribute applies to the Request, 
    /// 
    /// A header added to the Context.Request with `RequestPolicyHeader`
    /// 
    /// The name of the Policy is the Succeeded top most Policy for the User, such DefaultAdmin to TeamLeader
    /// </summary>
    /// <param name="policy"></param>
    public static isRequestFromActingAdmin(context: HttpContext): boolean {
        return this._isRequestFromWho(context, PolicyEnum.SiteActingAdmin);
    }

    /// <summary>
    /// Check if the policy name is GeneralAdmin
    /// 
    /// This is use to find the Request Made By
    /// 
    /// When PolicyAuthorizeAttribute applies to the Request, 
    /// 
    /// A header added to the Context.Request with `RequestPolicyHeader`
    /// 
    /// The name of the Policy is the Succeeded top most Policy for the User, such DefaultAdmin to TeamLeader
    /// </summary>
    /// <param name="policy"></param>
    public static isRequestFromGeneralAdmin(context: HttpContext): boolean {
        return this._isRequestFromWho(context, PolicyEnum.SiteGeneralAdmin);
    }

    /// <summary>
    /// Check if the policy name is DepartmentAdmin
    /// 
    /// This is use to find the Request Made By
    /// 
    /// When PolicyAuthorizeAttribute applies to the Request, 
    /// 
    /// A header added to the Context.Request with `RequestPolicyHeader`
    /// 
    /// The name of the Policy is the Succeeded top most Policy for the User, such DefaultAdmin to TeamLeader
    /// </summary>
    /// <param name="policy"></param>
    public static isRequestFromDepartmentAdmin(context: HttpContext): boolean {
        return this._isRequestFromWho(context, PolicyEnum.SiteDepartmentAdmin);
    }
    /// <summary>
    /// Check if the policy name is Manager
    /// 
    /// This is use to find the Request Made By
    /// 
    /// When PolicyAuthorizeAttribute applies to the Request, 
    /// 
    /// A header added to the Context.Request with `RequestPolicyHeader`
    /// 
    /// The name of the Policy is the Succeeded top most Policy for the User, such DefaultAdmin to TeamLeader
    /// </summary>
    /// <param name="policy"></param>
    public static isRequestFromManager(context: HttpContext): boolean {
        return this._isRequestFromWho(context, PolicyEnum.SiteManager);
    }
}
