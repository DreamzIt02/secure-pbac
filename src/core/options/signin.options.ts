

/**
 * Options for configuring sign in.
 */
export class SignInOptions {
    /**
     * Gets or sets a flag indicating whether a confirmed email address is required to sign in. Defaults to false.
     * True if a user must have a confirmed email address before they can sign in, otherwise false.
     */
    requireConfirmedEmail: boolean = false;

    /**
     * Gets or sets a flag indicating whether a confirmed telephone number is required to sign in. Defaults to false.
     * True if a user must have a confirmed telephone number before they can sign in, otherwise false.
     */
    requireConfirmedPhoneNumber: boolean = false;

    /**
     * Gets or sets a flag indicating whether a confirmed account is required to sign in. Defaults to false.
     * True if a user must have a confirmed account before they can sign in, otherwise false.
     */
    requireConfirmedAccount: boolean = false;
}
