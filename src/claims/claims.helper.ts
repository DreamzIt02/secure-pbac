import { ClaimsPrincipal } from "./claims.principal.js";
/**
 * Helper code used when implementing authentication middleware
 */
export class SecurityHelper
{
    /**
     * Add all ClaimsIdentities from an additional ClaimPrincipal to the ClaimsPrincipal
     * Merges a new claims principal, placing all new identities first, and eliminating
     * any empty unauthenticated identities from context.User
     * </summary>
     * <param name="existingPrincipal">The <see cref="ClaimsPrincipal"/> containing existing <see cref="ClaimsIdentity"/>.</param>
     * <param name="additionalPrincipal">The <see cref="ClaimsPrincipal"/> containing <see cref="ClaimsIdentity"/> to be added.</param>
     */ 
    public static mergeUserPrincipal(existingPrincipal: ClaimsPrincipal | null, additionalPrincipal: ClaimsPrincipal | null): ClaimsPrincipal
    {
        // For the first principal, just use the new principal rather than copying it
        if (existingPrincipal == null && additionalPrincipal != null)
        {
            return additionalPrincipal;
        }

        let newPrincipal = new ClaimsPrincipal();

        // New principal identities go first
        if (additionalPrincipal != null)
        {
            newPrincipal.addIdentities(additionalPrincipal.identities);
        }

        // Then add any existing non empty or authenticated identities
        if (existingPrincipal != null)
        {
            newPrincipal.addIdentities(existingPrincipal.identities.filter(i => i.isAuthenticated || i.claims.length > 0));
        }
        return newPrincipal;
    }
}
