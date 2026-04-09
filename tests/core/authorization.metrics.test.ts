import { describe, it, expect, vi } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { AuthorizationMetrics, AuthorizationResult, Counter, DefaultMeterFactory, Meter, TagList } from "../../src/core/index.js";

describe("AuthorizationMetrics", () => {
  // Authenticated user: give an authenticationType
  const userAuthenticated = new ClaimsPrincipal(
    new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")], "TestAuthType")
  );

  // Unauthenticated user: pass no authenticationType
  const userUnauthenticated = new ClaimsPrincipal(
    new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")])
  );


  it("constructs with meter factory and creates counter", () => {
    const factory = new DefaultMeterFactory();
    const metrics = new AuthorizationMetrics(factory);
    expect(metrics).toBeInstanceOf(AuthorizationMetrics);
  });

  it("authorizeAttemptCompleted increments counter with success result", () => {
    const factory = new DefaultMeterFactory();
    const metrics = new AuthorizationMetrics(factory);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = AuthorizationResult.success();
    metrics.authorizeAttemptCompleted(userAuthenticated, "TestPolicy", result, null);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("authorizeAttemptCompleted increments counter with failure result", () => {
    const factory = new DefaultMeterFactory();
    const metrics = new AuthorizationMetrics(factory);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = AuthorizationResult.failedDefault();
    metrics.authorizeAttemptCompleted(userUnauthenticated, "TestPolicy", result, null);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("authorizeAttemptCompleted adds exception tag", () => {
    const factory = new DefaultMeterFactory();
    const metrics = new AuthorizationMetrics(factory);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = AuthorizationResult.failedDefault();
    const exception = new DOMException("error");
    metrics.authorizeAttemptCompleted(userAuthenticated, "TestPolicy", result, exception);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("authorizeAttemptCompleted does nothing when counter disabled", () => {
    const factory = new DefaultMeterFactory();
    const metrics = new AuthorizationMetrics(factory);
    // disable counter
    (metrics as any).authorizedCount.enabled = false;
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    metrics.authorizeAttemptCompleted(userAuthenticated, "TestPolicy", AuthorizationResult.success(), null);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("Meter and Counter", () => {
  it("Meter creates counter and counter increments", () => {
    const meter = new Meter("testMeter");
    const counter = meter.createCounter<number>("testCounter", "unit", "desc");
    expect(counter.value).toBe(0);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    counter.add(5);
    expect(counter.value).toBe(5);
    spy.mockRestore();
  });

  it("Counter does not increment when disabled", () => {
    const counter = new Counter<number>("testCounter", "unit", "desc");
    counter.enabled = false;
    counter.add(5);
    expect(counter.value).toBe(0);
  });
});

describe("TagList", () => {
  it("TagList adds and stringifies tags", () => {
    const tags = new TagList([["key1", "value1"]]);
    tags.add("key2", "value2");
    const str = tags.toString();
    expect(str).toContain("key1=value1");
    expect(str).toContain("key2=value2");
  });
});
