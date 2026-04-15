/**
 * Provides an abstraction for normalizing keys (emails/names) for lookup purposes.
 */
export interface ILookupNormalizer {
    /**
     * Returns a normalized representation of the specified name.
     * @param name The key to normalize.
     * @returns A normalized representation of the specified name.
     */
    normalizeName(name: string | null): string | null;

    /**
     * Returns a normalized representation of the specified email.
     * @param email The email to normalize.
     * @returns A normalized representation of the specified email.
     */
    normalizeEmail(email: string | null): string | null;
}

/**
 * Default implementation of ILookupNormalizer.
 * Provides simple normalization by converting input to uppercase invariant form.
 */
export class LookupNormalizer implements ILookupNormalizer {
    /**
     * Returns a normalized representation of the specified name.
     * @param name The key to normalize.
     * @returns A normalized representation of the specified name.
     */
    normalizeName(name: string | null): string | null {
        if (name === null) {
            return null;
        }
        return name.toUpperCase();
    }

    /**
     * Returns a normalized representation of the specified email.
     * @param email The email to normalize.
     * @returns A normalized representation of the specified email.
     */
    normalizeEmail(email: string | null): string | null {
        if (email === null) {
            return null;
        }
        return email.toUpperCase();
    }
}
