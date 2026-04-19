// user.claims.principal.factory.ts

import { Claim, ClaimsIdentity, ClaimsPrincipal } from "../../claims/index.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/db.entity.js";
import { Inject } from "../../decorators/index.js";
import { IOptions } from "../../types/index.js";
import { RoleManager, UserManager } from "../identity/index.js";
import { ClaimsIdentityOptions, IdentityOptions } from "../options/index.js";
import { IdentityRole, IdentityUser } from "../types/index.js";

/**
 * Provides an abstraction for creating a claims principal for a given user.
 * Mirrors ASP.NET Core's IUserClaimsPrincipalFactory<TUser>.
 */
export interface IUserClaimsPrincipalFactory<TKey, TUser> {
  createAsync(user: TUser): Promise<ClaimsPrincipal>;
}

/**
 * Provides methods to create a claims principal for a given user.
 * Mirrors ASP.NET Core's UserClaimsPrincipalFactory<TUser> and UserClaimsPrincipalFactory<TUser, TRole>.
 */
export class UserClaimsPrincipalFactory<
  TKey  extends AllowedPrimaryKeysSafe, 
  TUser extends IdentityUser<TKey>, 
  TRole extends IdentityRole<TKey>>
  implements IUserClaimsPrincipalFactory<TKey, TUser> 
{
  public userManager : UserManager<TKey, TUser>;
  public roleManager?: RoleManager<TKey, TRole>;
  public options     : ClaimsIdentityOptions;
  
  constructor(userManager: UserManager<TKey, TUser>, options: IOptions<IdentityOptions>);
  constructor(userManager: UserManager<TKey, TUser>, roleManager: RoleManager<TKey, TRole>, options: IOptions<IdentityOptions>);
  constructor(userManager: UserManager<TKey, TUser>, arg2: RoleManager<TKey, TRole> | IOptions<IdentityOptions>, arg3?: IOptions<IdentityOptions>) {
    if (!userManager) throw new Error("userManager cannot be null");

    if (arg2 instanceof RoleManager) {
      if (!arg3?.value) throw new Error("optionsAccessor cannot wrap a null value");
      this.userManager = userManager;
      this.roleManager = arg2;
      this.options     = arg3?.value.claimsIdentity;
    } else {
      if (!arg2?.value) throw new Error("optionsAccessor cannot wrap a null value");
      this.userManager = userManager;
      this.options     = arg2.value.claimsIdentity;
    }
  }

  public async createAsync(user: TUser): Promise<ClaimsPrincipal> {
    if (!user) throw new Error("user cannot be null");
    const id = await this.generateClaimsAsync(user);
    return new ClaimsPrincipal(id);
  }

  protected async generateClaimsAsync(user: TUser): Promise<ClaimsIdentity> {
    const id = new ClaimsIdentity([], "Identity.Application", this.options.userNameClaimType, this.options.roleClaimType);

    // base user claims
    const userId = await this.userManager.getUserIdAsync(user);
    const userName = await this.userManager.getUserNameAsync(user);
    id.addClaim(new Claim(this.options.userIdClaimType, userId));
    id.addClaim(new Claim(this.options.userNameClaimType, userName!));

    if (this.userManager.supportsUserEmail) {
      const email = await this.userManager.getEmailAsync(user);
      if (email) id.addClaim(new Claim(this.options.emailClaimType, email));
    }

    if (this.userManager.supportsUserSecurityStamp) {
      id.addClaim(new Claim(this.options.securityStampClaimType, (await this.userManager.getSecurityStampAsync(user))!));
    }

    if (this.userManager.supportsUserClaim) {
      id.addClaims(await this.userManager.getClaimsAsync(user));
    }

    // role claims if roleManager is present
    if (this.roleManager && this.userManager.supportsUserRole) {
      const roles = await this.userManager.getRolesAsync(user);
      for (const roleName of roles) {
        id.addClaim(new Claim(this.options.roleClaimType, roleName));
        if (this.roleManager.supportsRoleClaims) {
          const role = await this.roleManager.findByNameAsync(roleName);
          if (role) {
            const roleClaims = await this.roleManager.getClaimsAsync(role);
            id.addClaims(roleClaims);
          }
        }
      }
    }

    return id;
  }
}
