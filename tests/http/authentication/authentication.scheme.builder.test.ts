import { describe, it, expect } from "vitest";
import { AuthenticationScheme, AuthenticationSchemeBuilder } from "../../../src/http/authentication/index.js";
import { InvalidOperationException } from "../../../src/types/exception.js";

describe("AuthenticationSchemeBuilder", () => {
  it("constructor sets name and getter returns it", () => {
    const builder = new AuthenticationSchemeBuilder("testScheme");
    expect(builder.name).toBe("testScheme");
  });

  it("displayName can be set and retrieved", () => {
    const builder = new AuthenticationSchemeBuilder("schemeWithDisplay");
    builder.displayName = "My Display Name";
    expect(builder.displayName).toBe("My Display Name");
  });

  it("build throws if handlerType is not configured", () => {
    const builder = new AuthenticationSchemeBuilder("badScheme");
    expect(() => builder.build()).toThrow(InvalidOperationException);
  });

  it("build returns AuthenticationScheme when handlerType is configured", () => {
    const builder = new AuthenticationSchemeBuilder("goodScheme");
    builder.handlerType = class DummyHandler {};
    builder.displayName = "Good Display";
    const scheme = builder.build();
    expect(scheme).toBeInstanceOf(AuthenticationScheme);
    expect(scheme.name).toBe("goodScheme");
    expect(scheme.displayName).toBe("Good Display");
    expect(scheme.handlerType).toBe(builder.handlerType);
  });

  it("build uses null displayName if not set", () => {
    const builder = new AuthenticationSchemeBuilder("nullDisplayScheme");
    builder.handlerType = class DummyHandler {};
    const scheme = builder.build();
    expect(scheme.displayName).toBeNull();
  });
});
