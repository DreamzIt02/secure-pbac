// claims.principal.ts

import { Claim } from "./claim.js";
import { ClaimsIdentity } from "./claims.identity.js";
import { IClaimsPrincipal } from "./types.js";

/**
 * Concrete IPrincipal supporting multiple claims-based identities.
 *
 * Mirrors System.Security.Claims.ClaimsPrincipal (simplified).
 */
export class ClaimsPrincipal implements IClaimsPrincipal {
  private _identities: ClaimsIdentity[] = [];

  /**
   * Initializes an instance of ClaimsPrincipal.
   */
  constructor();
  constructor(identity: ClaimsIdentity);
  constructor(identities: ClaimsIdentity[]);
  constructor(principal: ClaimsPrincipal);
  constructor(arg?: ClaimsIdentity | ClaimsIdentity[] | ClaimsPrincipal) {
    if (arg instanceof ClaimsIdentity) {
      this._identities.push(arg);
    } else if (Array.isArray(arg)) {
      this._identities.push(...arg);
    } else if (arg instanceof ClaimsPrincipal) {
      this._identities.push(...arg.identities);
    }
  }

  /**
   * Gets the collection of ClaimsIdentity.
   */
  public get identities(): ClaimsIdentity[] {
    return this._identities;
  }

  /**
   * Gets the identity of the current principal.
   * Returns the first identity if available.
   */
  public get identity(): ClaimsIdentity | undefined {
    return this._identities.length > 0 ? this._identities[0] : undefined;
  }

  /**
   * Gets the claims associated with this principal by enumerating all identities.
   */
  public get claims(): Claim[] {
    return this._identities.flatMap(i => i.claims);
  }

  /**
   * Adds a single ClaimsIdentity.
   */
  public addIdentity(identity: ClaimsIdentity): void {
    this._identities.push(identity);
  }

  /**
   * Adds multiple ClaimsIdentities.
   */
  public addIdentities(identities: ClaimsIdentity[]): void {
    this._identities.push(...identities);
  }

  /**
   * Creates a new instance of ClaimsPrincipal with values copied from this object.
   */
  public clone(): ClaimsPrincipal {
    return new ClaimsPrincipal(this);
  }

  /**
   * Retrieves all claims matching a predicate.
   */
  public findAll(match: (c: Claim) => boolean): Claim[] {
    return this.claims.filter(match);
  }

  /**
   * Retrieves all claims where Claim.Type equals type.
   */
  public findAllByType(type: string): Claim[] {
    return this.claims.filter(c => c.type === type);
  }

  /**
   * Retrieves the first claim matching a predicate.
   */
  public findFirst(match: (c: Claim) => boolean): Claim | undefined {
    return this.claims.find(match);
  }

  /**
   * Retrieves the first claim where Claim.Type equals type.
   */
  public findFirstByType(type: string): Claim | undefined {
    return this.claims.find(c => c.type === type);
  }

  /**
   * Retrieves the first claim where Claim.Type equals type.
   */
  public findFirstValue(type: string): string | undefined {
    return this.findFirstByType(type)?.value;
  }

  /**
   * Determines if a claim exists matching predicate.
   */
  public hasClaim(match: (c: Claim) => boolean): boolean {
    return this.claims.some(match);
  }

  /**
   * Determines if a claim of claimType AND claimValue exists.
   */
  public hasClaimTypeValue(type: string, value: string): boolean {
    return this.claims.some(c => c.type === type && c.value === value);
  }

  /**
   * Determines if the principal is in a given role.
   */
  public isInRole(role: string): boolean {
    return this._identities.some(i => i.hasClaim(i.roleClaimType, role));
  }
}
