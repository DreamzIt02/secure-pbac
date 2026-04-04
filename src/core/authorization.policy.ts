// Licensed under MIT-style license (conceptual port of ASP.NET Core Authorization)

import { IAuthorizationRequirement } from "./types.js";

/**
 * Represents a collection of authorization requirements and the scheme or
 * schemes they are evaluated against, all of which must succeed
 * for authorization to succeed.
 */
export class AuthorizationPolicy {
  /**
   * Gets a readonly list of IAuthorizationRequirements which must succeed for
   * this policy to be successful.
   */
  public readonly requirements: ReadonlyArray<IAuthorizationRequirement>;

  /**
   * Gets a readonly list of the authentication schemes the AuthorizationPolicy.Requirements
   * are evaluated against.
   */
  public readonly authenticationSchemes: ReadonlyArray<string>;

  /**
   * Creates a new instance of AuthorizationPolicy.
   * @param requirements The list of IAuthorizationRequirements which must succeed for this policy to be successful.
   * @param authenticationSchemes The authentication schemes the requirements are evaluated against.
   */
  constructor(requirements: IAuthorizationRequirement[], authenticationSchemes: string[]) {
    if (!requirements) {
      throw new Error("requirements cannot be null");
    }
    if (!authenticationSchemes) {
      throw new Error("authenticationSchemes cannot be null");
    }
    if (requirements.length === 0) {
      throw new Error("AuthorizationPolicy must have at least one requirement.");
    }

    this.requirements = Object.freeze([...requirements]);
    this.authenticationSchemes = Object.freeze([...authenticationSchemes]);
  }
}
