import { describe, it, expect } from "vitest";
import { IdentitySchemaVersions, StoreOptions, Version } from "../../../src/core/options/index.js";

describe("Version", () => {
  it("constructs with major and minor values", () => {
    const v = new Version(1, 2);
    expect(v.major).toBe(1);
    expect(v.minor).toBe(2);
  });
});

describe("IdentitySchemaVersions", () => {
  it("default version is 0.0", () => {
    const v = IdentitySchemaVersions.default;
    expect(v.major).toBe(0);
    expect(v.minor).toBe(0);
  });
});

describe("StoreOptions", () => {
  it("has correct default values", () => {
    const options = new StoreOptions();
    expect(options.maxLengthForKeys).toBe(0);
    expect(options.protectPersonalData).toBe(false);
    expect(options.schemaVersion.major).toBe(0);
    expect(options.schemaVersion.minor).toBe(0);
  });

  it("allows overriding maxLengthForKeys", () => {
    const options = new StoreOptions();
    options.maxLengthForKeys = 128;
    expect(options.maxLengthForKeys).toBe(128);
  });

  it("allows overriding protectPersonalData", () => {
    const options = new StoreOptions();
    options.protectPersonalData = true;
    expect(options.protectPersonalData).toBe(true);
  });

  it("allows overriding schemaVersion", () => {
    const options = new StoreOptions();
    const customVersion = new Version(2, 1);
    options.schemaVersion = customVersion;
    expect(options.schemaVersion.major).toBe(2);
    expect(options.schemaVersion.minor).toBe(1);
  });
});
