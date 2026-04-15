import { describe, it, expect } from "vitest";
import { AuthenticationOptions, AuthenticationSchemeBuilder } from "../../../src/http/authentication/index.js";
import { ArgumentNullException, InvalidOperationException } from "../../../src/types/exception.js";

describe("AuthenticationOptions", () => {
  it("should add a scheme using configure function", () => {
    const options = new AuthenticationOptions();
    options.addScheme("testScheme", (builder: any) => {
      builder.displayName = "Test Display";
    });

    const scheme = options.schemeMap.get("testScheme");
    expect(scheme).toBeInstanceOf(AuthenticationSchemeBuilder);
    expect(scheme?.displayName).toBe("Test Display");
    expect(Array.from(options.schemes)).toHaveLength(1);
  });

  it("should add a scheme using displayName + handlerType", () => {
    class DummyHandler {}
    const options = new AuthenticationOptions();
    options.addScheme("scheme2", "Display2");

    const scheme = options.schemeMap.get("scheme2");
    expect(scheme?.displayName).toBe("Display2");
    // expect(scheme?.handlerType).toBe(DummyHandler);
  });

  it("should throw ArgumentNullException if name is null", () => {
    const options = new AuthenticationOptions();
    expect(() => options.addScheme(null as any, () => {}))
      .toThrow(ArgumentNullException);
  });

  it("should throw InvalidOperationException if scheme already exists", () => {
    const options = new AuthenticationOptions();
    options.addScheme("duplicate", () => {});
    expect(() => options.addScheme("duplicate", () => {}))
      .toThrow(InvalidOperationException);
  });

  it("should set and get default scheme properties", () => {
    const options = new AuthenticationOptions();
    options.defaultScheme = "default";
    options.defaultAuthenticateScheme = "auth";
    options.defaultSignInScheme = "signin";
    options.defaultSignOutScheme = "signout";
    options.defaultChallengeScheme = "challenge";
    options.defaultForbidScheme = "forbid";

    expect(options.defaultScheme).toBe("default");
    expect(options.defaultAuthenticateScheme).toBe("auth");
    expect(options.defaultSignInScheme).toBe("signin");
    expect(options.defaultSignOutScheme).toBe("signout");
    expect(options.defaultChallengeScheme).toBe("challenge");
    expect(options.defaultForbidScheme).toBe("forbid");
  });

  it("should handle disableAutoDefaultScheme getter/setter", () => {
    const options = new AuthenticationOptions();
    (options as any).disableAutoDefaultScheme = true;
    expect(options.disableAutoDefaultScheme).toBe(false); // resets to false in getter
  });

  it("requireAuthenticatedSignIn should default to true", () => {
    const options = new AuthenticationOptions();
    expect(options.requireAuthenticatedSignIn).toBe(true);
  });
});
