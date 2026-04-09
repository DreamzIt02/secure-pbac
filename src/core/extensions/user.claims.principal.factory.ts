// user.claims.principal.factory.ts

import { Claim, ClaimsIdentity, ClaimsPrincipal } from "../../claims/index.js";
import { IOptions } from "../../types/index.js";
import { RoleManager, UserManager } from "../identity/index.js";
import { ClaimsIdentityOptions, IdentityOptions } from "../options/index.js";
import { IdentityRole, IdentityUser } from "../types/index.js";

/**
 * Provides an abstraction for creating a claims principal for a given user.
 * Mirrors ASP.NET Core's IUserClaimsPrincipalFactory<TUser>.
 */
export interface IUserClaimsPrincipalFactory<TUser extends IdentityUser> {
  createAsync(user: TUser): Promise<ClaimsPrincipal>;
}
/**
 * Provides methods to create a claims principal for a given user.
 *
 * Mirrors ASP.NET Core's UserClaimsPrincipalFactory<TUser>.
 */
// export class UserClaimsPrincipalFactory<TUser extends IdentityUser> 
// {
//   public userManager: UserManager<TUser>;
//   public options: ClaimsIdentityOptions;

//   constructor(userManager: UserManager<TUser>, options: ClaimsIdentityOptions) {
//     if (!userManager) throw new Error("userManager cannot be null");
//     if (!options) {
//       throw new Error("optionsAccessor cannot wrap a null value");
//     }
//     this.userManager = userManager;
//     this.options = options;
//   }

//   public async createAsync(user: TUser): Promise<ClaimsPrincipal> {
//     if (!user) throw new Error("user cannot be null");
//     const id = await this.generateClaimsAsync(user);
//     return new ClaimsPrincipal(id);
//   }

//   protected async generateClaimsAsync(user: TUser): Promise<ClaimsIdentity> {
//     const userId = await this.userManager.getUserIdAsync(user);
//     const userName = await this.userManager.getUserNameAsync(user);

//     const id = new ClaimsIdentity(
//       [],
//       "Identity.Application",
//       this.options.userNameClaimType,
//       this.options.roleClaimType
//     );

//     id.addClaim(new Claim(this.options.userIdClaimType, userId));
//     id.addClaim(new Claim(this.options.userNameClaimType, userName!));

//     if (this.userManager.supportsUserEmail) {
//       const email = await this.userManager.getEmailAsync(user);
//       if (email) {
//         id.addClaim(new Claim(this.options.emailClaimType, email));
//       }
//     }

//     if (this.userManager.supportsUserSecurityStamp) {
//       id.addClaim(
//         new Claim(
//           this.options.securityStampClaimType,
//           (await this.userManager.getSecurityStampAsync(user))!
//         )
//       );
//     }

//     if (this.userManager.supportsUserClaim) {
//       id.addClaims(await this.userManager.getClaimsAsync(user));
//     }

//     return id;
//   }
// }

/**
 * Provides methods to create a claims principal for a given user and role.
 *
 * Mirrors ASP.NET Core's UserClaimsPrincipalFactory<TUser, TRole>.
 */
// export class UserClaimsPrincipalFactory<TUser extends IdentityUser, TRole extends IdentityRole>
//   extends UserClaimsPrincipalFactory<TUser>
// {
//   public roleManager: RoleManager<TRole>;

//   constructor(
//     userManager: UserManager<TUser>,
//     roleManager: RoleManager<TRole>,
//     options: ClaimsIdentityOptions
//   ) {
//     super(userManager, options);
//     if (!roleManager) throw new Error("roleManager cannot be null");
//     this.roleManager = roleManager;
//   }

//   protected async generateClaimsAsync(user: TUser): Promise<ClaimsIdentity> {
//     const id = await super.generateClaimsAsync(user);

//     if (super.userManager.supportsUserRole) {
//       const roles = await super.userManager.getRolesAsync(user);
//       for (const roleName of roles) {
//         id.addClaim(new Claim(super.options.roleClaimType, roleName));

//         if (this.roleManager.supportsRoleClaims) {
//           const role = await this.roleManager.findByNameAsync(roleName);
//           if (role) {
//             id.addClaims(await this.roleManager.getClaimsAsync(role));
//           }
//         }
//       }
//     }

//     return id;
//   }
// }
/**
 * Provides methods to create a claims principal for a given user.
 * Mirrors ASP.NET Core's UserClaimsPrincipalFactory<TUser> and UserClaimsPrincipalFactory<TUser, TRole>.
 */
export class UserClaimsPrincipalFactory<TUser extends IdentityUser, TRole extends IdentityRole = IdentityRole>
  implements IUserClaimsPrincipalFactory<TUser> 
{
  public userManager: UserManager<TUser>;
  public roleManager?: RoleManager<TRole>;
  public options: ClaimsIdentityOptions;

  constructor(userManager: UserManager<TUser>, options: IOptions<IdentityOptions>);
  constructor(userManager: UserManager<TUser>, roleManager: RoleManager<TRole>, options: IOptions<IdentityOptions>);
  constructor(userManager: UserManager<TUser>, arg2: RoleManager<TRole> | IOptions<IdentityOptions>, arg3?: IOptions<IdentityOptions>) {
    if (!userManager) throw new Error("userManager cannot be null");

    if (arg2 instanceof RoleManager) {
      if (!arg3) throw new Error("optionsAccessor cannot wrap a null value");
      this.userManager = userManager;
      this.roleManager = arg2;
      this.options = arg3?.value.claimsIdentity;
    } else {
      if (!arg2) throw new Error("optionsAccessor cannot wrap a null value");
      this.userManager = userManager;
      this.options = arg2.value.claimsIdentity;;
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
            id.addClaims(await this.roleManager.getClaimsAsync(role));
          }
        }
      }
    }

    return id;
  }
}
