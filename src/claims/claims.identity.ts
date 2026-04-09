// claims.identity.ts

import { Claim } from "./claim.js";
import { ClaimTypes } from "./claim.types.js";
import { IClaimsIdentity } from "./types.js";

/**
 * An Identity that is represented by a set of claims.
 *
 * Mirrors System.Security.Claims.ClaimsIdentity (simplified).
 */
export class ClaimsIdentity implements IClaimsIdentity {
  private _claims            : Claim[]  = [];
  private _authenticationType: string   = ClaimsIdentity.DefaultAuthenticationType;
  private _nameClaimType     : string   = ClaimsIdentity.DefaultNameClaimType;
  private _roleClaimType     : string   = ClaimsIdentity.DefaultRoleClaimType;
  private _idClaimType       : string   = ClaimsIdentity.DefaultIdClaimType;

  public static readonly DefaultIssuer       : string = ClaimTypes.DefaultIssuer;
  public static readonly DefaultAuthenticationType: string = ClaimTypes.Authentication;
  public static readonly DefaultNameClaimType: string = ClaimTypes.Name;
  public static readonly DefaultRoleClaimType: string = ClaimTypes.Role;
  public static readonly DefaultIdClaimType  : string = ClaimTypes.NameIdentifier;

  /**
   * Initializes an instance of ClaimsIdentity.
   */
  constructor();
  constructor(claims: Claim[]);
  constructor(claims: Claim[], authenticationType: string);
  constructor(claims: Claim[], authenticationType: string, nameType?: string, roleType?: string, idType?: string);
  constructor(
    claims?  : Claim[],
    authenticationType?: string,
    nameType?: string,
    roleType?: string,
    idType?  : string,
  ) {
    if (claims)             this._claims.push(...claims);
    if (authenticationType) this._authenticationType  = authenticationType;
    if (nameType)           this._nameClaimType       = nameType;
    if (roleType)           this._roleClaimType       = roleType;
    if (idType)             this._idClaimType         = idType;
  }

  /**
   * Gets the authentication type that can be used to determine how this identity authenticated.
   */
  public get authenticationType(): string | undefined {
    return this._authenticationType;
  }

  /**
   * Gets a value that indicates if the user has been authenticated.
   */
  public get isAuthenticated(): boolean {
    return !!this._authenticationType;
  }

  /**
   * Gets the claims associated with this identity.
   */
  public get claims(): Claim[] {
    return this._claims;
  }

  /**
   * Gets the Name of this identity.
   * Returns the value of the first claim matching NameClaimType.
   */
  public get id(): string | undefined {
    const claim = this.findFirst(this._idClaimType);
    return claim ? claim.value : undefined;
  }
  /**
   * Gets the Name of this identity.
   * Returns the value of the first claim matching NameClaimType.
   */
  public get name(): string | undefined {
    const claim = this.findFirst(this._nameClaimType);
    return claim ? claim.value : undefined;
  }
  /**
   * Gets the value that identifies 'Name' claims.
   */
  public get nameClaimType(): string {
    return this._nameClaimType;
  }

  /**
   * Gets the value that identifies 'Role' claims.
   */
  public get roleClaimType(): string {
    return this._roleClaimType;
  }

  /**
   * Creates a new instance of ClaimsIdentity with values copied from this object.
   */
  public clone(): ClaimsIdentity {
    return new ClaimsIdentity([...this._claims], this._authenticationType, this._nameClaimType, this._roleClaimType, this._idClaimType);
  }

  /**
   * Adds a single claim.
   */
  public addClaim(claim: Claim): void {
    this._claims.push(claim);
  }

  /**
   * Adds multiple claims.
   */
  public addClaims(claims: Claim[]): void {
    this._claims.push(...claims);
  }

  /**
   * Retrieves the first claim where Claim.Type equals type.
   */
  public findFirst(type: string): Claim | undefined {
    return this._claims.find(c => c.type === type);
  }

  public hasClaim(type: string, value: string): boolean | undefined {
    return this._claims.some(c => c.type === type && c.value === value);
  }
}
