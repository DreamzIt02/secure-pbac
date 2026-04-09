// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { TokenProviderDescriptor } from "./token.provider.descriptor.js";

/**
 * Options for user tokens.
 */
export class TokenOptions {
    /**
     * Default token provider name used by email confirmation, password reset, and change email.
     */
    public static readonly defaultProvider: string = "Default";

    /**
     * Default token provider name used by the email provider.
     */
    public static readonly defaultEmailProvider: string = "Email";

    /**
     * Default token provider name used by the phone provider.
     */
    public static readonly defaultPhoneProvider: string = "Phone";

    /**
     * Default token provider name used by the AuthenticatorTokenProvider.
     */
    public static readonly defaultAuthenticatorProvider: string = "Authenticator";

    /**
     * Will be used to construct UserTokenProviders with the key used as the providerName.
     */
    providerMap: { [key: string]: TokenProviderDescriptor } = {};

    /**
     * Gets or sets the token provider used to generate tokens used in account confirmation emails.
     * The IUserTwoFactorTokenProvider<TUser> used to generate tokens used in account confirmation emails.
     */
    emailConfirmationTokenProvider: string = TokenOptions.defaultProvider;

    /**
     * Gets or sets the IUserTwoFactorTokenProvider<TUser> used to generate tokens used in password reset emails.
     * The IUserTwoFactorTokenProvider<TUser> used to generate tokens used in password reset emails.
     */
    passwordResetTokenProvider: string = TokenOptions.defaultProvider;

    /**
     * Gets or sets the ChangeEmailTokenProvider used to generate tokens used in email change confirmation emails.
     * The ChangeEmailTokenProvider used to generate tokens used in email change confirmation emails.
     */
    changeEmailTokenProvider: string = TokenOptions.defaultProvider;

    /**
     * Gets or sets the ChangePhoneNumberTokenProvider used to generate tokens used when changing phone numbers.
     * The ChangePhoneNumberTokenProvider used to generate tokens used when changing phone numbers.
     */
    changePhoneNumberTokenProvider: string = TokenOptions.defaultPhoneProvider;

    /**
     * Gets or sets the AuthenticatorTokenProvider used to validate two factor sign ins with an authenticator.
     * The AuthenticatorTokenProvider used to validate two factor sign ins with an authenticator.
     */
    authenticatorTokenProvider: string = TokenOptions.defaultAuthenticatorProvider;

    /**
     * Gets or sets the issuer used for the authenticator issuer.
     */
    authenticatorIssuer: string = "Microsoft.AspNetCore.Identity.UI";
}
