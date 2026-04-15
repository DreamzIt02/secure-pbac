import { describe, it, expect } from "vitest";
import { TokenOptions, TokenProviderDescriptor } from "../../../src/core/options/index.js";

describe("TokenOptions", () => {
  it("has correct static default provider names", () => {
    expect(TokenOptions.defaultProvider).toBe("Default");
    expect(TokenOptions.defaultEmailProvider).toBe("Email");
    expect(TokenOptions.defaultPhoneProvider).toBe("Phone");
    expect(TokenOptions.defaultAuthenticatorProvider).toBe("Authenticator");
  });

  it("has correct default property values", () => {
    const options = new TokenOptions();
    expect(options.emailConfirmationTokenProvider).toBe(TokenOptions.defaultProvider);
    expect(options.passwordResetTokenProvider).toBe(TokenOptions.defaultProvider);
    expect(options.changeEmailTokenProvider).toBe(TokenOptions.defaultProvider);
    expect(options.changePhoneNumberTokenProvider).toBe(TokenOptions.defaultPhoneProvider);
    expect(options.authenticatorTokenProvider).toBe(TokenOptions.defaultAuthenticatorProvider);
    expect(options.authenticatorIssuer).toBe("PBAC.Secure.Identity.UI");
    expect(options.providerMap).toEqual({});
  });

  it("allows overriding emailConfirmationTokenProvider", () => {
    const options = new TokenOptions();
    options.emailConfirmationTokenProvider = "CustomEmailProvider";
    expect(options.emailConfirmationTokenProvider).toBe("CustomEmailProvider");
  });

  it("allows overriding passwordResetTokenProvider", () => {
    const options = new TokenOptions();
    options.passwordResetTokenProvider = "CustomPasswordProvider";
    expect(options.passwordResetTokenProvider).toBe("CustomPasswordProvider");
  });

  it("allows overriding changeEmailTokenProvider", () => {
    const options = new TokenOptions();
    options.changeEmailTokenProvider = "CustomChangeEmailProvider";
    expect(options.changeEmailTokenProvider).toBe("CustomChangeEmailProvider");
  });

  it("allows overriding changePhoneNumberTokenProvider", () => {
    const options = new TokenOptions();
    options.changePhoneNumberTokenProvider = "CustomPhoneProvider";
    expect(options.changePhoneNumberTokenProvider).toBe("CustomPhoneProvider");
  });

  it("allows overriding authenticatorTokenProvider", () => {
    const options = new TokenOptions();
    options.authenticatorTokenProvider = "CustomAuthenticatorProvider";
    expect(options.authenticatorTokenProvider).toBe("CustomAuthenticatorProvider");
  });

  it("allows overriding authenticatorIssuer", () => {
    const options = new TokenOptions();
    options.authenticatorIssuer = "CustomIssuer";
    expect(options.authenticatorIssuer).toBe("CustomIssuer");
  });

  it("allows adding to providerMap", () => {
    const options = new TokenOptions();
    const descriptor = new TokenProviderDescriptor(class {});
    options.providerMap["Custom"] = descriptor;
    expect(options.providerMap["Custom"]).toBe(descriptor);
    expect(options.providerMap["Custom"].ProviderType).toBeInstanceOf(Function);
  });
});
