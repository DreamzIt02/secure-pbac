import { describe, it, expect } from "vitest";
import { ArgumentNullThrowHelper, Exceptions } from "../../src/types/exception.js";

describe("ArgumentNullThrowHelper", () => {
  it("throwIfNull should throw on null", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNull(null))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throwIfNull should throw on undefined", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNull(undefined))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throwIfNull should NOT throw on empty string", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNull("")).not.toThrow();
  });

  it("throwIfNullOrEmpty should throw on null", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty(null))
      .toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("throwIfNullOrEmpty should throw on undefined", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty(undefined))
      .toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("throwIfNullOrEmpty should throw on empty string", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty(""))
      .toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("throwIfNullOrEmpty should NOT throw on non-empty string", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty("hello")).not.toThrow();
  });

  it("throwIfOutOfRange should throw when index < 0", () => {
    expect(() => ArgumentNullThrowHelper.throwIfOutOfRange(-1, 5))
      .toThrow(Exceptions.ArgumentOutOfRangeException);
  });

  it("throwIfOutOfRange should throw when index >= length", () => {
    expect(() => ArgumentNullThrowHelper.throwIfOutOfRange(5, 5))
      .toThrow(Exceptions.ArgumentOutOfRangeException);
  });

  it("throwIfOutOfRange should NOT throw when index is valid", () => {
    expect(() => ArgumentNullThrowHelper.throwIfOutOfRange(2, 5)).not.toThrow();
  });

  it("throwIfInvalidOperation should throw when condition is true", () => {
    expect(() => ArgumentNullThrowHelper.throwIfInvalidOperation(true))
      .toThrow(Exceptions.InvalidOperationException);
  });

  it("throwIfInvalidOperation should NOT throw when condition is false", () => {
    expect(() => ArgumentNullThrowHelper.throwIfInvalidOperation(false)).not.toThrow();
  });

  it("throwNotImplemented should always throw", () => {
    expect(() => ArgumentNullThrowHelper.throwNotImplemented())
      .toThrow(Exceptions.NotImplementedException);
  });
});

// ✅ This suite covers:
// - Null/undefined vs empty string behavior  
// - Out of range checks  
// - Invalid operation checks  
// - Not implemented exception  
