// identity.role.claim.ts

import { Claim } from "../../claims/index.js";

/// <summary>
/// Represents a claim that is granted to all users within a role.
/// </summary>
/// <typeparam name="TKey">The type of the primary key of the role associated with this claim.</typeparam>
export class IdentityRoleClaim<TKey> {
    /// <summary>
    /// FIXME: Gets or sets the identifier for this role claim.
    /// </summary>
    // public id: number = 0;

    /// <summary>
    /// Gets or sets the primary key of the role associated with this claim.
    /// </summary>
    public roleId!: TKey;

    /// <summary>
    /// Gets or sets the claim type for this claim.
    /// </summary>
    public claimType?: string;

    /// <summary>
    /// Gets or sets the claim value for this claim.
    /// </summary>
    public claimValue?: string;

    /// <summary>
    /// Constructs a new claim with the type and value.
    /// </summary>
    /// <returns>The Claim that was produced.</returns>
    public toClaim(): Claim {
        return new Claim(this.claimType!, this.claimValue!);
    }

    /// <summary>
    /// Initializes by copying ClaimType and ClaimValue from the other claim.
    /// </summary>
    /// <param name="other">The claim to initialize from.</param>
    public initializeFromClaim(other?: Claim): void {
        this.claimType = other?.type;
        this.claimValue = other?.value;
    }
}
