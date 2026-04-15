// identity.claims.options.ts

import { ClaimTypes } from "../../claims/index.js";

/**
 * Options used to configure the claim types used for well known claims.
 *
 * Mirrors ASP.NET Core's ClaimsIdentityOptions.
 */
export class ClaimsIdentityOptions {
  /**
   * Gets or sets the ClaimType used for a Role claim.
   * Defaults to ClaimTypes.Role.
   */
  public roleClaimType: string = ClaimTypes.Role;

  /**
   * Gets or sets the ClaimType used for the user name claim.
   * Defaults to ClaimTypes.Name.
   */
  public userNameClaimType: string = ClaimTypes.Name;

  /**
   * Gets or sets the ClaimType used for the user identifier claim.
   * Defaults to ClaimTypes.NameIdentifier.
   */
  public userIdClaimType: string = ClaimTypes.NameIdentifier;

  /**
   * Gets or sets the ClaimType used for the user email claim.
   * Defaults to ClaimTypes.Email.
   */
  public emailClaimType: string = ClaimTypes.Email;

  /**
   * Gets or sets the ClaimType used for the security stamp claim.
   * Defaults to "App.Identity.SecurityStamp".
   */
  public securityStampClaimType: string = "App.Identity.SecurityStamp";
}
