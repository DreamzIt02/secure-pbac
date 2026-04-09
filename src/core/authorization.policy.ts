import { ArgumentNullThrowHelper, InvalidOperationException } from "../types/exception.js";
import { isEmpty } from "../utils.js";
import { IAuthorizationRequirement } from "./types/index.js";

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
  constructor(requirements: Iterable<IAuthorizationRequirement>, authenticationSchemes: Iterable<string>) {
    ArgumentNullThrowHelper.throwIfNull(requirements);
    ArgumentNullThrowHelper.throwIfNull(authenticationSchemes);

    if (isEmpty(requirements))
    {
        throw new InvalidOperationException("AuthorizationPolicy must have at least one requirement.");
    }

    this.requirements = Object.freeze([...requirements]);
    this.authenticationSchemes = Object.freeze([...authenticationSchemes]);
  }

  // Implement the iterator protocol so AuthorizationPolicy is Iterable
  [Symbol.iterator](): Iterator<IAuthorizationRequirement> {
    let index = 0;
    const reqs = this.requirements;
    return {
      next(): IteratorResult<IAuthorizationRequirement> {
        if (index < reqs.length) {
          return { value: reqs[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}
