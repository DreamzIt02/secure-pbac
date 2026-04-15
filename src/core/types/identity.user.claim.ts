// identity.user.claim.ts

import { Claim } from "../../claims/index.js";

/// <summary>
/// Represents a claim that a user possesses.
/// </summary>
/// <typeparam name="TKey">The type used for the primary key for this user that possesses this claim.</typeparam>
export class IdentityUserClaim<TKey> {
    /// <summary>
    /// FIXME: Gets or sets the identifier for this user claim.
    /// </summary>
    // public id: number = 0;

    /// <summary>
    /// Gets or sets the primary key of the user associated with this claim.
    /// </summary>
    public userId!: TKey;

    /// <summary>
    /// Gets or sets the claim type for this claim.
    /// </summary>
    public claimType?: string;

    /// <summary>
    /// Gets or sets the claim value for this claim.
    /// </summary>
    public claimValue?: string;

    /// <summary>
    /// Converts the entity into a Claim instance.
    /// </summary>
    public toClaim(): Claim {
        return new Claim(this.claimType!, this.claimValue!);
    }

    /// <summary>
    /// Reads the type and value from the Claim.
    /// </summary>
    public initializeFromClaim(claim: Claim): void {
        this.claimType = claim.type;
        this.claimValue = claim.value;
    }
}
