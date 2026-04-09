// operation.authorization.requirement.ts

import { IAuthorizationRequirement } from "../../core/types/index.js";


/**
 * A helper class to provide a useful IAuthorizationRequirement which contains a name.
 *
 * This mirrors ASP.NET Core's OperationAuthorizationRequirement, allowing we to
 * define named requirements (e.g. "Create", "Read", "Update", "Delete", "ManagerOperation").
 *
 * Example usage:
 * ```ts
 * const requirement = new OperationAuthorizationRequirement("Create");
 * console.log(requirement.toString()); 
 * // "OperationAuthorizationRequirement:Name=Create"
 * ```
 */
export class OperationAuthorizationRequirement implements IAuthorizationRequirement {
  /**
   * The name of this instance of IAuthorizationRequirement.
   */
  public name: string;

  /**
   * Initializes a new instance of OperationAuthorizationRequirement.
   *
   * @param name The name of the requirement (e.g. "Create", "Read", "Update", "Delete").
   */
  constructor(name: string) {
    if (!name) {
      throw new Error("ArgumentNullException: name");
    }
    this.name = name;
  }

  /**
   * Returns a string representation of the requirement.
   *
   * @returns A string in the format "OperationAuthorizationRequirement:Name={name}".
   */
  toString(): string {
    return `OperationAuthorizationRequirement:Name=${this.name}`;
  }
}
