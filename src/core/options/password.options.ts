

/**
 * Specifies options for password requirements.
 */
export class PasswordOptions {
    /**
     * Gets or sets the minimum length a password must be. Defaults to 6.
     */
    requiredLength: number = 6;

    /**
     * Gets or sets the minimum number of unique characters which a password must contain. Defaults to 1.
     */
    requiredUniqueChars: number = 1;

    /**
     * Gets or sets a flag indicating if passwords must contain a non-alphanumeric character. Defaults to true.
     * True if passwords must contain a non-alphanumeric character, otherwise false.
     */
    requireNonAlphanumeric: boolean = true;

    /**
     * Gets or sets a flag indicating if passwords must contain a lower case ASCII character. Defaults to true.
     * True if passwords must contain a lower case ASCII character.
     */
    requireLowercase: boolean = true;

    /**
     * Gets or sets a flag indicating if passwords must contain an upper case ASCII character. Defaults to true.
     * True if passwords must contain an upper case ASCII character.
     */
    requireUppercase: boolean = true;

    /**
     * Gets or sets a flag indicating if passwords must contain a digit. Defaults to true.
     * True if passwords must contain a digit.
     */
    requireDigit: boolean = true;
}
