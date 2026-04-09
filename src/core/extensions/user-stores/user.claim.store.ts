// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { IClaim } from "../../../claims/types.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityUser } from "../../types/index.js";
import { IUserStore } from "./user.store.js";

/**
 * Provides an abstraction for a store of claims for a user.
 * @typeparam TUser The type encapsulating a user.
 */
export interface IUserClaimStore<TUser extends IdentityUser> extends IUserStore<TUser> {
    /**
     * Gets a list of Claims belonging to the specified user as an asynchronous operation.
     * @param user The user whose claims to retrieve.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the result of the asynchronous query, a list of Claims.
     */
    getClaimsAsync(user: TUser, cancellationToken: CancellationToken): Promise<IClaim[]>;

    /**
     * Add claims to a user as an asynchronous operation.
     * @param user The user to add the claim to.
     * @param claims The collection of Claims to add.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    addClaimsAsync(user: TUser, claims: Iterable<IClaim>, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Replaces the given claim on the specified user with the newClaim.
     * @param user The user to replace the claim on.
     * @param claim The claim to replace.
     * @param newClaim The new claim to replace the existing claim with.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    replaceClaimAsync(user: TUser, claim: IClaim, newClaim: IClaim, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Removes the specified claims from the given user.
     * @param user The user to remove the specified claims from.
     * @param claims A collection of Claims to remove.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the asynchronous operation.
     */
    removeClaimsAsync(user: TUser, claims: Iterable<IClaim>, cancellationToken: CancellationToken): Promise<void>;

    /**
     * Returns a list of users who contain the specified Claim.
     * @param claim The claim to look for.
     * @param cancellationToken The CancellationToken used to propagate notifications that the operation should be canceled.
     * @returns A Promise that represents the result of the asynchronous query, a list of users who contain the specified claim.
     */
    getUsersForClaimAsync(claim: IClaim, cancellationToken: CancellationToken): Promise<TUser[]>;
}
