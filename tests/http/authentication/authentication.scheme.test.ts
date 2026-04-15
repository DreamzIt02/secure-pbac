import { describe, it, expect } from "vitest";
import { AuthenticationScheme } from "../../../src/http/authentication/index.js";

describe("AuthenticationScheme", () => {
  class DummyHandler {}

  it("initializes with valid arguments", () => {
    const scheme = new AuthenticationScheme("TestScheme", "Test Display", DummyHandler);
    expect(scheme.name).toBe("TestScheme");
    expect(scheme.displayName).toBe("Test Display");
    expect(scheme.handlerType).toBe(DummyHandler);
  });

  it("allows displayName to be null", () => {
    const scheme = new AuthenticationScheme("NullDisplay", null, DummyHandler);
    expect(scheme.name).toBe("NullDisplay");
    expect(scheme.displayName).toBeNull();
    expect(scheme.handlerType).toBe(DummyHandler);
  });

  it("throws error when name is null", () => {
    expect(() => new AuthenticationScheme(null as any, "Display", DummyHandler))
      .toThrowError("ArgumentNullException: name");
  });

  it("throws error when handlerType is null", () => {
    expect(() => new AuthenticationScheme("Scheme", "Display", null as any))
      .toThrowError("ArgumentNullException: handlerType");
  });

  it("throws error when handlerType is not a function", () => {
    expect(() => new AuthenticationScheme("Scheme", "Display", {} as any))
      .toThrowError("ArgumentException: handlerType must implement IAuthenticationHandler.");
  });

  it("allows overriding properties after construction", () => {
    const scheme = new AuthenticationScheme("Scheme", "Display", DummyHandler);
    scheme.name = "NewName";
    scheme.displayName = "NewDisplay";
    scheme.handlerType = function CustomHandler() {};
    expect(scheme.name).toBe("NewName");
    expect(scheme.displayName).toBe("NewDisplay");
    expect(typeof scheme.handlerType).toBe("function");
  });
});
