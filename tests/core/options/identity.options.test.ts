import { describe, it, expect } from "vitest";
import { ClaimsIdentityOptions, IdentityOptions, LockoutOptions, PasswordOptions, SignInOptions, StoreOptions, TokenOptions, UserOptions } from "../../../src/core/options/index.js";

describe("IdentityOptions", () => {
  it("initializes with correct default option instances", () => {
    const options = new IdentityOptions();
    expect(options.claimsIdentity).toBeInstanceOf(ClaimsIdentityOptions);
    expect(options.user).toBeInstanceOf(UserOptions);
    expect(options.password).toBeInstanceOf(PasswordOptions);
    expect(options.lockout).toBeInstanceOf(LockoutOptions);
    expect(options.signIn).toBeInstanceOf(SignInOptions);
    expect(options.tokens).toBeInstanceOf(TokenOptions);
    expect(options.stores).toBeInstanceOf(StoreOptions);
  });

  it("allows overriding claimsIdentity", () => {
    const options = new IdentityOptions();
    const custom = new ClaimsIdentityOptions();
    custom.roleClaimType = "CustomRole";
    options.claimsIdentity = custom;
    expect(options.claimsIdentity.roleClaimType).toBe("CustomRole");
  });

  it("allows overriding user options", () => {
    const options = new IdentityOptions();
    const custom = new UserOptions();
    custom.requireUniqueEmail = true;
    options.user = custom;
    expect(options.user.requireUniqueEmail).toBe(true);
  });

  it("allows overriding password options", () => {
    const options = new IdentityOptions();
    const custom = new PasswordOptions();
    custom.requiredLength = 12;
    options.password = custom;
    expect(options.password.requiredLength).toBe(12);
  });

  it("allows overriding lockout options", () => {
    const options = new IdentityOptions();
    const custom = new LockoutOptions();
    custom.maxFailedAccessAttempts = 10;
    options.lockout = custom;
    expect(options.lockout.maxFailedAccessAttempts).toBe(10);
  });

  it("allows overriding signIn options", () => {
    const options = new IdentityOptions();
    const custom = new SignInOptions();
    custom.requireConfirmedEmail = true;
    options.signIn = custom;
    expect(options.signIn.requireConfirmedEmail).toBe(true);
  });

  it("allows overriding token options", () => {
    const options = new IdentityOptions();
    const custom = new TokenOptions();
    custom.authenticatorIssuer = "CustomIssuer";
    options.tokens = custom;
    expect(options.tokens.authenticatorIssuer).toBe("CustomIssuer");
  });

  it("allows overriding store options", () => {
    const options = new IdentityOptions();
    const custom = new StoreOptions();
    custom.maxLengthForKeys = 256;
    options.stores = custom;
    expect(options.stores.maxLengthForKeys).toBe(256);
  });
});
