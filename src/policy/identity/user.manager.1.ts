import { Claim, ClaimsPrincipal, SiteClaim } from '../../claims/index.js';
import { AuthorizeClaimEnum, AuthorizeClaimTypeEnum, AuthorizeClaimPriorityEnum } from '../../claims/index.js';
import { ILookupNormalizer, IPasswordHasher, IUserStore, PasswordHasher } from '../../core/extensions/index.js';
import { AsyncLocalUserStore } from '../../core/extensions/user-stores/index.js';
import { IdentityError, IdentityErrorDescriber, IdentityResult, UserManager } from '../../core/identity/index.js';
import { IdentityOptions } from '../../core/options/index.js';
import { IdentityUser } from '../../core/types/index.js';
import { IPasswordValidator, IUserValidator } from '../../core/validators/index.js';
import { tryParseEnum } from '../../types/enums.js';
import { IdentityErrorCode } from '../../types/error.codes.js';
import { IOptions } from '../../types/index.js';
import { PriorManagers, SiteManager } from '../site.manager.js';

export interface IdentityUser1 extends IdentityUser {}

export class UserManager1<TUser extends IdentityUser1> extends UserManager<TUser> {
  protected store: IUserStore<TUser>;
  protected passwordHasher: IPasswordHasher<TUser>;
  protected userValidators: IUserValidator<TUser>[] = [];
  protected passwordValidators: IPasswordValidator<TUser>[] = [];
  // public keyNormalizer: ILookupNormalizer;
  // public errorDescriber: IdentityErrorDescriber;
  // public options: IdentityOptions;

  constructor(
    store: IUserStore<TUser> = new AsyncLocalUserStore(),
    passwordHasher: IPasswordHasher<TUser> = new PasswordHasher(),
    userValidators: IUserValidator<TUser>[] = [],
    passwordValidators: IPasswordValidator<TUser>[] = [],
    keyNormalizer: ILookupNormalizer,
    errorDescriber: IdentityErrorDescriber,
    optionsAccessor: IOptions<IdentityOptions>,
  ) {
    super(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errorDescriber)

    this.store = store
    this.passwordHasher = passwordHasher
  }

  async hasClaimAsync(user: TUser, claim: Claim): Promise<boolean> {
    if (!user) return false;
    const claims = await this.getClaimsAsync(user);
    return claims?.some(c => c.type === claim.type && c.value === claim.value);
  }
  /// <summary>
  /// Check if the `ClaimsPrincipal User` has valid claim for `SignIn`
  /// </summary>
  /// <param name="manager"></param>
  /// <param name="User"></param>
  /// <param name="logger"></param>
  async hasSignInClaimAsync(User: ClaimsPrincipal): Promise<boolean> {
    var user = await this.getUserAsync(User);
    if (user == null)
    {
        /// <summary>
        /// Allows to passed 'AllowAnonymous', when globally sets filter 'ClaimAuthorizeAttribute' in 'Startup.ConfigureServices'
        /// </summary>
        return true;
    }

    const claims = await this.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    if (!claim) return false;

    /// <summary>
    /// Check type and value
    /// </summary>
    return User.hasClaim(cc => cc.type == claim.type && cc.value == claim.value)
  }
  /// <summary>
  /// Add the `SignIn` claim for the logged in user
  /// </summary>
  /// <param name="user"></param>
  async addSignInClaimAsync(user: TUser): Promise<IdentityResult> {
    let result: IdentityResult = IdentityResult.failed([
      new IdentityError(IdentityErrorCode.Invalid, `Failed to add ${SiteClaim.SignInClaimType} claim`)]);

    if (!user) {
      return result;
    }
    const claims = await this.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    if (!claim) {
      return this.addClaimAsync(user, SiteClaim.newSignInClaim());
    }
    return IdentityResult.success();
  }
  /// <summary>
  /// Update the `SignIn` claim for the logged in user
  /// 
  /// So then, the User must log in again with refreshed indentity
  /// </summary>
  /// <param name="user"></param>
  async updateSignInClaimAsync(user: TUser): Promise<IdentityResult> {
    let result: IdentityResult = IdentityResult.failed([
      new IdentityError(IdentityErrorCode.Invalid, `Failed to update {SiteClaim.SignInClaimType} claim`)]);
    if (!user) {
      return result;
    }
    
    const claims = await this.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === SiteClaim.SignInClaimType);
    if (!claim) {
      return this.addClaimAsync(user, SiteClaim.newSignInClaim());
    } else {
      return this.replaceClaimAsync(user, claim, SiteClaim.newSignInClaim());
    }
  }
  /// <summary>
  /// Get the Department of the `Manager`
  /// 
  /// If there any department claim possesses by the User
  /// </summary>
  /// <param name="user">The user of which the Department to detect</param>
  /// <param name="logger"></param>
  async getDepartmentAsync(user: TUser): Promise<AuthorizeClaimEnum | null> {
    const claimType = SiteClaim.authorizeClaimTypeName(AuthorizeClaimTypeEnum.Department);
    const claims = await this.getClaimsAsync(user);
    const claim = claims?.find(c => c.type === claimType);
    if (!claim || !claim.value) return null;
    const parsed = parseInt(claim.value, 10);
    return isNaN(parsed) ? null : tryParseEnum(AuthorizeClaimEnum, parsed);
  }

  async getPriorityAsync(user: TUser, provider: AuthorizeClaimEnum): Promise<number> {
    const claim = SiteManager.priorityClaim(provider, null);
    const claims = await this.getClaimsAsync(user);
    const found = claims?.find(c => c.type === claim.type);
    return found ? parseInt(found.value || '0', 10) || 0 : 0;
  }

  async priorManagerResolve(provider: AuthorizeClaimEnum, managers: TUser[]): Promise<PriorManagers<TUser>> {
    const claimType = SiteManager.priorManagerClaimType(provider);
    const result = new PriorManagers<TUser>();
    for (const user of managers) {
      if (await this.hasClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.A)) ))) {
        result.A.push(user);
      } else if (
          await this.hasClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.B)) ))) {
        result.B.push(user);
      } else if (
          await this.hasClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.C)) ))) {
        result.C.push(user);
      } else if (
          await this.hasClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.D)) ))) {
        result.D.push(user);
      } else if (
          await this.hasClaimAsync(user, new Claim(claimType, String(SiteManager.priorManagerClaimValue(AuthorizeClaimPriorityEnum.E)) ))) {
        result.E.push(user);
      }
      result.Z.push(user);
    }
    return result;
  }
}
