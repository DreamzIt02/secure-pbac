// exception.test.ts
import { describe, it, expect } from "vitest";
import { HResults, Exceptions, ArgumentNullThrowHelper, ObjectDisposedThrowHelper,
         SystemException, ArgumentException, ArgumentNullException, 
         ObjectDisposedException} from "../../src/types/exception.js";

describe("HResults constants", () => {
  it("should have correct values", () => {
    expect(HResults.COR_E_DIRECTORYNOTFOUND).toBe(0x80070003);
    expect(HResults.COR_E_FILENOTFOUND).toBe(0x80070002);
    expect(HResults.COR_E_EXCEPTION).toBe(0x80131500);
    expect(HResults.COR_E_ARGUMENT).toBe(0x800701CE);
    expect(HResults.E_POINTER).toBe(0x800711CE);
  });
});

describe("SystemException", () => {
  it("should set name and message", () => {
    const ex = new SystemException("Test message");
    expect(ex.name).toBe("SystemException");
    expect(ex.message).toBe("Test message");
  });

  it("should accept innerException", () => {
    const inner = new Error("Inner");
    const ex = new SystemException("Outer", undefined, inner);
    expect((ex as any).innerException).toBe(inner);
  });
});

describe("ArgumentException", () => {
  it("should include paramName in message", () => {
    const ex = new ArgumentException("Bad arg", "paramX");
    expect(ex.message).toContain("paramX");
  });

  it("throwIfNullOrEmpty should throw on empty string", () => {
    expect(() => ArgumentException.throwIfNullOrEmpty("")).toThrow(ArgumentException);
  });

  it("throwIfNullOrWhiteSpace should throw on whitespace", () => {
    expect(() => ArgumentException.throwIfNullOrWhiteSpace("   ")).toThrow(ArgumentException);
  });
});

describe("ArgumentNullException", () => {
  it("should set hResult to E_POINTER", () => {
    const ex = new ArgumentNullException("paramY");
    expect(ex.hResult).toBe(HResults.E_POINTER);
  });

  it("throwIfNull should throw when null", () => {
    expect(() => ArgumentNullException.throwIfNull(null, "paramZ")).toThrow(ArgumentNullException);
  });

  it("throwIfNullPointer should throw when null", () => {
    expect(() => ArgumentNullException.throwIfNullPointer(null, "ptr")).toThrow(ArgumentNullException);
  });

  it("throwIfNullIntPtr should throw when 0", () => {
    expect(() => ArgumentNullException.throwIfNullIntPtr(0, "intptr")).toThrow(ArgumentNullException);
  });
});

describe("ArgumentNullThrowHelper", () => {
  it("throwIfNull should throw", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNull(null)).toThrow(Exceptions.ArgumentNullException);
  });

  it("throwIfNullOrEmpty should throw on empty string", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty("")).toThrow(Exceptions.ArgumentNullOrEmptyException);
  });

  it("throwIfOutOfRange should throw when index invalid", () => {
    expect(() => ArgumentNullThrowHelper.throwIfOutOfRange(5, 3)).toThrow(Exceptions.ArgumentOutOfRangeException);
  });

  it("throwIfInvalidOperation should throw when condition true", () => {
    expect(() => ArgumentNullThrowHelper.throwIfInvalidOperation(true)).toThrow(Exceptions.InvalidOperationException);
  });

  it("throwNotImplemented should always throw", () => {
    expect(() => ArgumentNullThrowHelper.throwNotImplemented()).toThrow(Exceptions.NotImplementedException);
  });
});

describe("ObjectDisposedThrowHelper", () => {
  it("should throw when disposed is true", () => {
    expect(() => ObjectDisposedThrowHelper.throwIf(true, {})).toThrowError("ObjectDisposedException");
  });

  it("should not throw when disposed is false", () => {
    expect(() => ObjectDisposedThrowHelper.throwIf(false, {})).not.toThrow();
  });
});

// Branch coverage improvements
describe("ArgumentNullThrowHelper branch coverage", () => {
  it("throwIfNull should NOT throw when value is non-null", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNull("ok")).not.toThrow();
  });

  it("throwIfNullOrEmpty should NOT throw when string has content", () => {
    expect(() => ArgumentNullThrowHelper.throwIfNullOrEmpty("hello")).not.toThrow();
  });

  it("throwIfOutOfRange should NOT throw when index is valid", () => {
    expect(() => ArgumentNullThrowHelper.throwIfOutOfRange(1, 3)).not.toThrow();
  });

  it("throwIfInvalidOperation should NOT throw when condition is false", () => {
    expect(() => ArgumentNullThrowHelper.throwIfInvalidOperation(false)).not.toThrow();
  });
});

describe("ObjectDisposedThrowHelper branch coverage", () => {
  it("throwIf should NOT throw when disposed is false", () => {
    expect(() => ObjectDisposedThrowHelper.throwIf(false, {})).not.toThrow();
  });

  it("throwIf should throw when disposed is true", () => {
    expect(() => ObjectDisposedThrowHelper.throwIf(true, {})).toThrow(ObjectDisposedException);
  });
});

describe("ArgumentException branch coverage", () => {
  it("throwIfNullOrEmpty should NOT throw when argument has content", () => {
    expect(() => ArgumentException.throwIfNullOrEmpty("valid")).not.toThrow();
  });

  it("throwIfNullOrWhiteSpace should NOT throw when argument has non-whitespace content", () => {
    expect(() => ArgumentException.throwIfNullOrWhiteSpace("valid")).not.toThrow();
  });

  it("throwIfNullOrWhiteSpace should throw when argument is whitespace", () => {
    expect(() => ArgumentException.throwIfNullOrWhiteSpace("   ")).toThrow(ArgumentException);
  });
});

describe("ArgumentNullException branch coverage", () => {
  it("throwIfNull should NOT throw when argument is non-null", () => {
    expect(() => ArgumentNullException.throwIfNull("ok")).not.toThrow();
  });

  it("throwIfNullPointer should NOT throw when argument is non-null", () => {
    expect(() => ArgumentNullException.throwIfNullPointer("not null")).not.toThrow();
  });

  it("throwIfNullIntPtr should NOT throw when argument is non-zero", () => {
    expect(() => ArgumentNullException.throwIfNullIntPtr(42)).not.toThrow();
  });
});
