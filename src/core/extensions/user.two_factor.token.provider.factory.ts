import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { TokenOptions } from "../options/index.js";
import { IdentityUser } from "../types/index.js";
import { EmailTokenProvider } from "./user.email.token.provider.js";
import { PhoneNumberTokenProvider } from "./user.phone.token.provider.js";
import { AuthenticatorTokenProvider } from "./user.two_factor.token.provider.impl.js";
import { IUserTwoFactorTokenProvider } from "./user.two_factor.token.provider.js";

export class UserTwoFactorTokenProviderFactory<
  TKey extends AllowedPrimaryKeysSafe,
  TUser extends IdentityUser<TKey>
> {
  // Define the default providers once
  private static defaultProviders: Map<string, IUserTwoFactorTokenProvider<any, any>> = new Map([
    [TokenOptions.defaultProvider,              new AuthenticatorTokenProvider()],
    [TokenOptions.defaultEmailProvider,         new EmailTokenProvider()],
    [TokenOptions.defaultPhoneProvider,         new PhoneNumberTokenProvider()],
    [TokenOptions.defaultAuthenticatorProvider, new AuthenticatorTokenProvider()],
  ]);

  /**
   * Returns the default token providers map.
   */
  static defaultTokenProviders<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>(): Map<string, IUserTwoFactorTokenProvider<TKey, TUser>> {
    return this.defaultProviders as Map<string, IUserTwoFactorTokenProvider<TKey, TUser>>;
  }

  /**
   * Returns all default token provider names.
   */
  static defaultTokenProviderNames(): string[] {
    return Array.from(this.defaultProviders.keys());
  }
}
