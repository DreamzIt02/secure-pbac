import { describe, it, expect } from "vitest";
import { SignInResult } from "../../../src/core/identity/index.js";

describe("SignInResult", () => {
  it("constructor defaults to all false", () => {
    const result = new SignInResult();
    expect(result.succeeded).toBe(false);
    expect(result.isLockedOut).toBe(false);
    expect(result.isNotAllowed).toBe(false);
    expect(result.requiresTwoFactor).toBe(false);
    expect(result.toString()).toBe("Failed");
  });

  it("constructor sets succeeded true", () => {
    const result = new SignInResult({ succeeded: true });
    expect(result.succeeded).toBe(true);
    expect(result.toString()).toBe("Succeeded");
  });

  it("constructor sets lockedOut true", () => {
    const result = new SignInResult({ isLockedOut: true });
    expect(result.isLockedOut).toBe(true);
    expect(result.toString()).toBe("LockedOut");
  });

  it("constructor sets notAllowed true", () => {
    const result = new SignInResult({ isNotAllowed: true });
    expect(result.isNotAllowed).toBe(true);
    expect(result.toString()).toBe("NotAllowed");
  });

  it("constructor sets requiresTwoFactor true", () => {
    const result = new SignInResult({ requiresTwoFactor: true });
    expect(result.requiresTwoFactor).toBe(true);
    expect(result.toString()).toBe("RequiresTwoFactor");
  });

  it("static success returns succeeded result", () => {
    const result = SignInResult.success;
    expect(result.succeeded).toBe(true);
    expect(result.toString()).toBe("Succeeded");
  });

  it("static failed returns failed result", () => {
    const result = SignInResult.failed;
    expect(result.succeeded).toBe(false);
    expect(result.toString()).toBe("Failed");
  });

  it("static lockedOut returns lockedOut result", () => {
    const result = SignInResult.lockedOut;
    expect(result.isLockedOut).toBe(true);
    expect(result.toString()).toBe("LockedOut");
  });

  it("static notAllowed returns notAllowed result", () => {
    const result = SignInResult.notAllowed;
    expect(result.isNotAllowed).toBe(true);
    expect(result.toString()).toBe("NotAllowed");
  });

  it("static twoFactorRequired returns twoFactorRequired result", () => {
    const result = SignInResult.twoFactorRequired;
    expect(result.requiresTwoFactor).toBe(true);
    expect(result.toString()).toBe("RequiresTwoFactor");
  });
});
