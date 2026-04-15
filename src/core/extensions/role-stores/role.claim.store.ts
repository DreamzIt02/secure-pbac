

import { IClaim } from "../../../claims/types.js";
import { AllowedPrimaryKeysSafe } from "../../../contexts/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityRole } from "../../types/index.js";
import { IRoleStore } from "./role.store.js";

/**
 * Provides an abstraction for a store of role specific claims.
 * @typeparam TRole The type encapsulating a role.
 */
export interface IRoleClaimStore<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> extends IRoleStore<TKey, TRole> {
    /**
     * Gets a list of Claims belonging to the specified role as an asynchronous operation.
     * @param role The role whose claims to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the result of the asynchronous query, a list of Claims.
     */
    getClaimsAsync(role: TRole, cancellationToken?: CancellationToken): Promise<IClaim[]>;

    /**
     * Add a new claim to a role as an asynchronous operation.
     * @param role The role to add a claim to.
     * @param claim The Claim to add.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    addClaimAsync(role: TRole, claim: IClaim, cancellationToken?: CancellationToken): Promise<void>;

    /**
     * Remove a claim from a role as an asynchronous operation.
     * @param role The role to remove the claim from.
     * @param claim The Claim to remove.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeClaimAsync(role: TRole, claim: IClaim, cancellationToken?: CancellationToken): Promise<void>;
}
