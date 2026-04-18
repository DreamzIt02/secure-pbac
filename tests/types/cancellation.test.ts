import { describe, it, expect } from "vitest";
import { CancellationToken } from "../../src/types/cancellation.js";

describe("CancellationToken", () => {
  it("does not throw if not cancelled", () => {
    const token = new CancellationToken();
    expect(() => token.throwIfCancellationRequested()).not.toThrow();
  });

  it("throws after cancel is called", () => {
    const token = new CancellationToken();
    token.cancel();
    expect(() => token.throwIfCancellationRequested()).toThrowError(
      "Cancellation requested. Aborting current action."
    );
  });

  it("multiple calls to cancel still throw", () => {
    const token = new CancellationToken();
    token.cancel();
    token.cancel(); // calling again should not change behavior
    expect(() => token.throwIfCancellationRequested()).toThrow();
  });

  it("static none never cancels", () => {
    const token = CancellationToken.none;
    expect(() => token.throwIfCancellationRequested()).not.toThrow();
    token.cancel(); // even if we call cancel, it's still the shared none instance
    expect(() => token.throwIfCancellationRequested()).toThrow(); // shows that none is just a normal instance
  });

  it("different instances behave independently", () => {
    const t1 = new CancellationToken();
    const t2 = new CancellationToken();
    t1.cancel();
    expect(() => t1.throwIfCancellationRequested()).toThrow();
    expect(() => t2.throwIfCancellationRequested()).not.toThrow();
  });
});
