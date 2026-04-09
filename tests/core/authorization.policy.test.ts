import { describe, it, expect } from "vitest";
import { AuthorizationPolicy } from "../../src/core/index.js";
import { Exceptions, InvalidOperationException } from "../../src/types/exception.js";

// Mock requirement
class MockRequirement {}

describe("AuthorizationPolicy", () => {
  it("constructs with valid requirements and schemes", () => {
    const reqs = [new MockRequirement()];
    const schemes = ["scheme1", "scheme2"];
    const policy = new AuthorizationPolicy(reqs, schemes);

    expect(policy.requirements).toEqual(reqs);
    expect(policy.authenticationSchemes).toEqual(schemes);
    expect(Object.isFrozen(policy.requirements)).toBe(true);
    expect(Object.isFrozen(policy.authenticationSchemes)).toBe(true);
  });

  it("throws ArgumentNullException if requirements is null", () => {
    expect(() => new AuthorizationPolicy(null as any, ["scheme"]))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throws ArgumentNullException if authenticationSchemes is null", () => {
    expect(() => new AuthorizationPolicy([new MockRequirement()], null as any))
      .toThrow(Exceptions.ArgumentNullException);
  });

  it("throws InvalidOperationException if requirements is empty", () => {
    expect(() => new AuthorizationPolicy([], ["scheme"]))
      .toThrow(InvalidOperationException);
  });

  it("iterator yields requirements sequentially", () => {
    const reqs = [new MockRequirement(), new MockRequirement()];
    const policy = new AuthorizationPolicy(reqs, ["scheme"]);
    const iterated = [...policy];
    expect(iterated.length).toBe(2);
    expect(iterated[0]).toBe(reqs[0]);
    expect(iterated[1]).toBe(reqs[1]);
  });

  it("iterator returns done when finished", () => {
    const reqs = [new MockRequirement()];
    const policy = new AuthorizationPolicy(reqs, ["scheme"]);
    const iterator = policy[Symbol.iterator]();
    expect(iterator.next().done).toBe(false);
    expect(iterator.next().done).toBe(true);
  });
});
