import { describe, it, expect, beforeEach } from "vitest";
import {
  AuthenticationOptions,
  AuthenticationScheme,
  AuthenticationSchemeBuilder,
  AuthenticationSchemeProvider
} from "../../../src/http/authentication/index.js";
import { IOptions } from "../../../src/types/index.js";

// Dummy handler type
class DummyHandler {}

// Dummy builder that configures handlerType
class DummyBuilder extends AuthenticationSchemeBuilder {
  constructor(name: string) {
    super(name);
    this.handlerType = DummyHandler;   // ensure handlerType is configured
    this.displayName = "dummy display";
  }
}

describe("AuthenticationSchemeProvider", () => {
  let options: AuthenticationOptions;
  let provider: AuthenticationSchemeProvider;

  beforeEach(() => {
    options = new AuthenticationOptions();
    options.schemes = [new DummyBuilder("scheme1")]; // builder with handlerType set
    provider = new AuthenticationSchemeProvider({ value: options } as IOptions<AuthenticationOptions>);
  });

  it("initializes schemes from options", async () => {
    const all = await provider.getAllSchemesAsync();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe("scheme1");
  });

  it("getSchemeAsync returns scheme when found", async () => {
    const scheme = await provider.getSchemeAsync("scheme1");
    expect(scheme?.name).toBe("scheme1");
  });

  it("getSchemeAsync returns null when not found", async () => {
    const scheme = await provider.getSchemeAsync("missing");
    expect(scheme).toBeNull();
  });

  it("tryAddScheme returns false if scheme already exists", () => {
    const scheme = new AuthenticationScheme("scheme1", "display", DummyHandler);
    const result = provider.tryAddScheme(scheme);
    expect(result).toBe(false);
  });

  it("tryAddScheme returns true and adds new scheme", async () => {
    const scheme = new AuthenticationScheme("scheme2", "display", DummyHandler);
    const result = provider.tryAddScheme(scheme);
    expect(result).toBe(true);
    const found = await provider.getSchemeAsync("scheme2");
    expect(found?.name).toBe("scheme2");
  });

  it("addScheme throws if scheme already exists", () => {
    const scheme = new AuthenticationScheme("scheme1", "display", DummyHandler);
    expect(() => provider.addScheme(scheme)).toThrow();
  });

  it("addScheme adds new scheme successfully", async () => {
    const scheme = new AuthenticationScheme("scheme3", "display", DummyHandler);
    provider.addScheme(scheme);
    const found = await provider.getSchemeAsync("scheme3");
    expect(found?.name).toBe("scheme3");
  });

  it("removeScheme does nothing if scheme not found", () => {
    expect(() => provider.removeScheme("missing")).not.toThrow();
  });

  it("removeScheme removes existing scheme", async () => {
    const scheme = new AuthenticationScheme("scheme4", "display", DummyHandler);
    provider.addScheme(scheme);
    provider.removeScheme("scheme4");
    const found = await provider.getSchemeAsync("scheme4");
    expect(found).toBeNull();
  });

  it("getDefaultAuthenticateSchemeAsync returns configured scheme", async () => {
    options.defaultAuthenticateScheme = "scheme1";
    const scheme = await provider.getDefaultAuthenticateSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("getDefaultAuthenticateSchemeAsync falls back to defaultScheme", async () => {
    options.defaultAuthenticateScheme = undefined;
    options.defaultScheme = "scheme1";
    const scheme = await provider.getDefaultAuthenticateSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("getDefaultChallengeSchemeAsync returns configured scheme", async () => {
    options.defaultChallengeScheme = "scheme1";
    const scheme = await provider.getDefaultChallengeSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("getDefaultForbidSchemeAsync returns configured scheme", async () => {
    options.defaultForbidScheme = "scheme1";
    const scheme = await provider.getDefaultForbidSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("getDefaultSignInSchemeAsync returns configured scheme", async () => {
    options.defaultSignInScheme = "scheme1";
    const scheme = await provider.getDefaultSignInSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("getDefaultSignOutSchemeAsync returns configured scheme", async () => {
    options.defaultSignOutScheme = "scheme1";
    const scheme = await provider.getDefaultSignOutSchemeAsync();
    expect(scheme?.name).toBe("scheme1");
  });

  it("checkAutoDefaultScheme sets auto default when only one scheme", async () => {
    const scheme = new AuthenticationScheme("unique", "display", DummyHandler);
    // Create provider with no initial schemes
    const emptyOptions = new AuthenticationOptions();
    const newProvider = new AuthenticationSchemeProvider({ value: emptyOptions } as IOptions<AuthenticationOptions>);
    newProvider.addScheme(scheme); // now exactly one scheme
    const result = await (newProvider as any).getDefaultSchemeAsync();
    expect(result?.name).toBe("unique");
  });
});
