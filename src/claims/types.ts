
/**
 * Interface describing the shape of Claim.
 * Mirrors System.Security.Claims.Claim contract.
 */
export interface IClaim {
  type: string;
  value: string;
  valueType: string;
  issuer: string;
  originalIssuer: string;
  subject?: IClaimsIdentity;

  clone(identity?: IClaimsIdentity): IClaim;
  equals(claim2: IClaim): boolean;
  includes(claim2Type: string, claim2Values: Iterable<string> | undefined): boolean;
  toString(): string;
}

/**
 * Interface describing the shape of ClaimsIdentity.
 * Mirrors System.Security.Claims.ClaimsIdentity contract.
 */
export interface IClaimsIdentity {
  authenticationType: string | undefined;
  isAuthenticated: boolean;
  claims: IClaim[];
  name: string | undefined;
  nameClaimType: string;
  roleClaimType: string;

  clone(): IClaimsIdentity;
  addClaim(claim: IClaim): void;
  addClaims(claims: IClaim[]): void;
  findFirst(type: string): IClaim | undefined;
  hasClaim(type: string, value: string): boolean | undefined;
}

/**
 * Interface describing the shape of ClaimsPrincipal.
 * Mirrors System.Security.Claims.ClaimsPrincipal contract.
 */
export interface IClaimsPrincipal {
  identities: IClaimsIdentity[];
  identity?: IClaimsIdentity;
  claims: IClaim[];

  addIdentity(identity: IClaimsIdentity): void;
  addIdentities(identities: IClaimsIdentity[]): void;
  clone(): IClaimsPrincipal;
  findAll(match: (c: IClaim) => boolean): IClaim[];
  findAllByType(type: string): IClaim[];
  findFirst(match: (c: IClaim) => boolean): IClaim | undefined;
  findFirstByType(type: string): IClaim | undefined;
  findFirstValue(type: string): string | undefined;
  hasClaim(match: (c: IClaim) => boolean): boolean;
  hasClaimTypeValue(type: string, value: string): boolean;
  isInRole(role: string): boolean;
}
