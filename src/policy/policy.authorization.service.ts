import { PolicyEnum } from '../policies/index.js';
import { AuthorizeClaimEnum, ClaimsPrincipal } from '../claims/index.js';
import { AuthorizationResult } from '../core/index.js';
import { IManagerInfo } from '../types/index.js';
import { IdentityUser } from '../core/types/index.js';
import { AllowedPrimaryKeysSafe } from '../contexts/index.js';

// Interface extracted from C# IPolicyAuthorizationService
export interface IPolicyAuthorizationService<TKey  extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey> = IdentityUser<TKey>> {
  /**
   * Authorize an User for Policy, the user fulfil from the given policy list
   * </summary>
   * <param name="user"></param>
   * <param name="policies"></param>
   * <param name="checkDefault"></param>
   */
  authorizeAsync(user: ClaimsPrincipal, policies: PolicyEnum[], checkDefault: boolean): Promise<AuthorizationResult>;
  /**
   * Authorize an User for Policy, the user fulfil from the given policy list
   * </summary>
   * <param name="user"></param>
   * <param name="policies"></param>
   * <param name="checkDefault"></param>
   */ 
  authorizeAsync(user: ClaimsPrincipal, policies: PolicyEnum[]): Promise<AuthorizationResult>;
  /**
   * 
   * </summary>
   * <param name="user"></param>
   * <param name="policy"></param>
   */ 
  authorizeAsync(user: ClaimsPrincipal, policy: PolicyEnum): Promise<AuthorizationResult>;


  /**
   * This authorizes only the Default Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin is not amendable and removable
   * </summary>
   * <param name="user"></param>
   */ 
  isDefaultAdmin(user: ClaimsPrincipal): Promise<AuthorizationResult>;
  /**
   * This authorizes only the Default Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin is not amendable and removable
   * </summary>
   */
  isDefaultAdmin(user: TUser): Promise<AuthorizationResult>;

  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the Acting Admin
   * </summary>
   * <param name="user"></param>
   */
  isActingAdmin(user: ClaimsPrincipal): Promise<AuthorizationResult>;
  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the Acting Admin
   * </summary>
   * <param name="user"></param>
   */
  isActingAdmin(user: TUser): Promise<AuthorizationResult>;

  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isGeneralAdmin(user: ClaimsPrincipal): Promise<AuthorizationResult>;
  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isGeneralAdmin(user: TUser): Promise<AuthorizationResult>;
  
  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isDepartmentAdmin(user: ClaimsPrincipal, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isDepartmentAdmin(user: TUser, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;

  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isDepartmentManager(user: ClaimsPrincipal, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;
  /**
   * This authorizes only the Acting Admin of the Site
   * 
   * The default admin is created, when the First Migrations applied
   * 
   * The default admin then, assigns the General Admin
   * </summary>
   * <param name="user"></param>
   */
  isDepartmentManager(user: TUser, claim?: AuthorizeClaimEnum): Promise<AuthorizationResult>;

  /**
   * This confirmed that the target user is in administration role
   * 
   * May or not assigned any required department, but still is an administrator
   * 
   * This mostly require to check when, UserAdmin updates the property of the Target User
   * 
   * If target User is an Administrative Staff, then the UserAdmin must have to be the `Manager` of the target User
   * </summary>
   * <param name="user">The target user</param>
   */
  isInAdminGroup(user: ClaimsPrincipal): Promise<boolean>;
  /**
   * This confirmed that the target user is in administration role
   * 
   * May or not assigned any required department, but still is an administrator
   * 
   * This mostly require to check when, UserAdmin updates the property of the Target User
   * 
   * If target User is an Administrative Staff, then the UserAdmin must have to be the `Manager` of the target User
   * </summary>
   * <param name="user">The target user</param>
   */
  isInAdminGroup(user: TUser): Promise<boolean>;
  /**
   * Must not one of GeneralAdmin, ActingAdmin or DefaultAdmin
   * 
   * true, if the given user is one of the [GeneralAdmin, ActingAdmin or DefaultAdmin]
   * </summary>
   * <param name="user"></param>
   */
  forbiddenAdminGroup(user: ClaimsPrincipal): Promise<boolean>;
    /**
   * Must not one of GeneralAdmin, ActingAdmin or DefaultAdmin
   * 
   * true, if the given user is one of the [GeneralAdmin, ActingAdmin or DefaultAdmin]
   * </summary>
   * <param name="user"></param>
   */
  forbiddenAdminGroup(user: TUser): Promise<boolean>;
  /**
   * The authorized user is an administrator
   * </summary>
   * <param name="User"></param>
   * <returns></returns>
   */
  authorizeAdminGroup(user: ClaimsPrincipal): Promise<boolean>;
  /**
   * The authorized user is an administrator
   * </summary>
   * <param name="User"></param>
   * <returns></returns>
   */
  authorizeAdminGroup(user: TUser): Promise<boolean>;

  /**
   * The authorized user is an administrative manager
   * </summary>
   * <param name="User"></param>
   * <returns></returns>
   */
  authorizeManagerGroup(user: ClaimsPrincipal): Promise<boolean>;

  /**
   * The authorized user is an administrative manager
   * </summary>
   * <param name="User"></param>
   * <returns></returns>
   */
  authorizeManagerGroup(user: TUser): Promise<boolean>;

  /**
   * Get default admin
   * </summary>
   */
  getDefaultAdmin(): Promise<TUser>;
  /**
   * Get current ActingAdmin
   * </summary>
   */
  getActingAdmin(): Promise<TUser>;
  /**
   * Get current GeneralAdmin
   * </summary>
   */
  getGeneralAdmin(): Promise<TUser>;
  /**
   * Get current admin of the Department
   * </summary>
   * <param name="department"></param>
   */
  getDepartmentAdmin(department: AuthorizeClaimEnum): Promise<TUser>;
  /**
   * Get all the DepartmentAdmin for all the available departments
   * 
   * The admins are current for respective department they belong to
   * </summary>
   */
  getDepartmentAdmins(departments: AuthorizeClaimEnum[]): Promise<TUser[]>;
  /**
   * Get all the managers for given department
   * </summary>
   * <param name="department"></param>
   */
  getDepartmentManagers(department: AuthorizeClaimEnum): Promise<TUser[]>;

  /**
   * Check and validate if the Resource has a valid Manager assigned
   * </summary>
   * <param name="item">The Resource it self</param>
   * <param name="department">The department, the resource is belong to</param>
   */
  getValidManager(item: IManagerInfo, department?: AuthorizeClaimEnum): Promise<TUser>;
  /**
   * Check and validate if the Resource has a valid Manager assigned
   * </summary>
   * <param name="item">The Resource it self</param>
   * <param name="department">The department, the resource is belong to</param>
   */
  hasValidManager(item: IManagerInfo, department?: AuthorizeClaimEnum): Promise<boolean>;
}
