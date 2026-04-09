// claim.ts

import { IClaim, IClaimsIdentity } from "./types.js";
import { ClaimValueTypes } from "./claim.value.types.js";
import { ClaimTypes } from "./claim.types.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";

/**
 * A Claim is a statement about an entity by an Issuer.
 * Mirrors System.Security.Claims.Claim (simplified).
 */
export class Claim implements IClaim {
  public type: string;
  public value: string;
  public valueType: string;
  public issuer: string;
  public originalIssuer: string;
  public subject?: IClaimsIdentity;
  /**
   * Creates a Claim with the specified type and value.
   * Issuer and OriginalIssuer default to ClaimsIdentity.DefaultIssuer.
   * ValueType defaults to ClaimValueTypes.String.
   */
  constructor(type: string, value: string);
  constructor(type: string, value: string, valueType?: string);
  constructor(type: string, value: string, valueType?: string, issuer?: string);
  constructor(type: string, value: string, valueType?: string, issuer?: string, originalIssuer?: string);
  constructor(type: string, value: string, valueType?: string, issuer?: string, originalIssuer?: string, subject?: IClaimsIdentity);
  constructor(
    type: string,
    value: string,
    valueType?: string,
    issuer?: string,
    originalIssuer?: string,
    subject?: IClaimsIdentity
  ) {
    ArgumentNullThrowHelper.throwIfNull(type);
    ArgumentNullThrowHelper.throwIfNull(value);

    this.type = type;
    this.value = value;
    this.valueType = valueType || ClaimValueTypes.String;
    this.issuer = issuer || ClaimTypes.DefaultIssuer;
    this.originalIssuer = originalIssuer || this.issuer;
    this.subject = subject;
  }

  /**
   * Creates a new Claim with values copied from this object.
   */
  public clone(identity?: IClaimsIdentity): Claim {
    return new Claim(
      this.type,
      this.value,
      this.valueType,
      this.issuer,
      this.originalIssuer,
      identity
    );
  }

  public equals(claim2: Claim): boolean {
    return this.type.toLowerCase() === claim2.type.toLowerCase() 
      && (!this.value || this.value === claim2.value);
  }

  public includes(claim2Type: string, claim2Values: Iterable<string> | undefined): boolean {
    return this.type.toLowerCase() === claim2Type.toLowerCase() 
      && (!claim2Values || [...claim2Values].includes(this.value));
  }

  /**
   * Returns a string representation of the Claim.
   */
  public toString(): string {
    return `${this.type}: ${this.value}`;
  }
}
