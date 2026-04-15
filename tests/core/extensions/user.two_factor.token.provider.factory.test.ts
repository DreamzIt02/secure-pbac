import { describe, it, expect } from "vitest";
import { AuthenticatorTokenProvider, EmailTokenProvider, PhoneNumberTokenProvider, UserTwoFactorTokenProviderFactory } from "../../../src/core/extensions/index.js";
import { TokenOptions } from "../../../src/core/options/index.js";


describe("UserTwoFactorTokenProviderFactory", () => {
  it("defaultTokenProviders should return a Map with expected providers", () => {
    const providers = UserTwoFactorTokenProviderFactory.defaultTokenProviders();

    // Check that it's a Map
    expect(providers).toBeInstanceOf(Map);

    // Check that all expected keys exist
    expect(providers.has(TokenOptions.defaultProvider)).toBe(true);
    expect(providers.has(TokenOptions.defaultEmailProvider)).toBe(true);
    expect(providers.has(TokenOptions.defaultPhoneProvider)).toBe(true);
    expect(providers.has(TokenOptions.defaultAuthenticatorProvider)).toBe(true);

    // Check that values are instances of the correct provider classes
    expect(providers.get(TokenOptions.defaultProvider)).toBeInstanceOf(AuthenticatorTokenProvider);
    expect(providers.get(TokenOptions.defaultEmailProvider)).toBeInstanceOf(EmailTokenProvider);
    expect(providers.get(TokenOptions.defaultPhoneProvider)).toBeInstanceOf(PhoneNumberTokenProvider);
    expect(providers.get(TokenOptions.defaultAuthenticatorProvider)).toBeInstanceOf(AuthenticatorTokenProvider);
  });

  it("defaultTokenProviderNames should return all provider names", () => {
    const names = UserTwoFactorTokenProviderFactory.defaultTokenProviderNames();

    // Should be an array of strings
    expect(Array.isArray(names)).toBe(true);

    // Should contain all expected keys
    expect(names).toContain(TokenOptions.defaultProvider);
    expect(names).toContain(TokenOptions.defaultEmailProvider);
    expect(names).toContain(TokenOptions.defaultPhoneProvider);
    expect(names).toContain(TokenOptions.defaultAuthenticatorProvider);

    // Length should match number of providers
    expect(names.length).toBe(4);
  });
});
