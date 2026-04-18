

import { AuthorizationResult } from "./authorization.result.js";
import { IAuthorizationRequirement } from "./types/index.js";
import { ClaimsPrincipal } from "../claims/index.js";

/**
 * Checks policy based permissions for a user
 * </summary>
 */
export interface IAuthorizationService
{
    /**
     * Checks if a user meets a specific set of requirements for the specified resource
     * </summary>
     * <param name="user">The user to evaluate the requirements against.</param>
     * <param name="resource">
     * An optional resource the policy should be checked with.
     * If a resource is not required for policy evaluation we may pass null as the value.
     * </param>
     * <param name="requirements">The requirements to evaluate.</param>
     * <returns>
     * A <see cref="Task{TResult}"/> that contains an <see cref="AuthorizationResult"/> indicating whether authorization has succeeded.
     * The result's <see cref="AuthorizationResult.Succeeded"/> property is <c>true</c> when the user fulfills the policy; otherwise <c>false</c>.
     * </returns>
     * <remarks>
     * Resource is an optional parameter and may be null. Please ensure that we check it is not
     * null before acting upon it.
     * </remarks>
     */
    authorizeAsync(user: ClaimsPrincipal, resource:  object | null, requirements: Iterable<IAuthorizationRequirement>): Promise<AuthorizationResult>;

    /**
     * Checks if a user meets a specific authorization policy
     * </summary>
     * <param name="user">The user to check the policy against.</param>
     * <param name="resource">
     * An optional resource the policy should be checked with.
     * If a resource is not required for policy evaluation we may pass null as the value.
     * </param>
     * <param name="policyName">The name of the policy to check against a specific context.</param>
     * <returns>
     * A <see cref="Task{TResult}"/> that contains an <see cref="AuthorizationResult"/> indicating whether authorization has succeeded.
     * The result's <see cref="AuthorizationResult.Succeeded"/> property is <c>true</c> when the policy has been fulfilled; otherwise <c>false</c>.
     * </returns>
     * <remarks>
     * Resource is an optional parameter and may be null. Please ensure that we check it is not
     * null before acting upon it.
     * </remarks>
     */
    authorizeAsync(user: ClaimsPrincipal, resource:  object | null, policyName: string): Promise<AuthorizationResult>;
}
