import { describe, it, expect } from "vitest";
import { UserLoginInfo } from "../../../src/core/types/index.js";

describe("UserLoginInfo", () => {
  it("initializes with provided values", () => {
    const info = new UserLoginInfo("Google", "12345", "Google Display");
    expect(info.loginProvider).toBe("Google");
    expect(info.providerKey).toBe("12345");
    expect(info.providerDisplayName).toBe("Google Display");
  });

  it("allows providerDisplayName to be null", () => {
    const info = new UserLoginInfo("Facebook", "abcde", null);
    expect(info.loginProvider).toBe("Facebook");
    expect(info.providerKey).toBe("abcde");
    expect(info.providerDisplayName).toBeNull();
  });

  it("allows overriding loginProvider", () => {
    const info = new UserLoginInfo("Local", "xyz", "Local Provider");
    info.loginProvider = "CustomProvider";
    expect(info.loginProvider).toBe("CustomProvider");
  });

  it("allows overriding providerKey", () => {
    const info = new UserLoginInfo("Twitter", "handle123", "Twitter Provider");
    info.providerKey = "newKey";
    expect(info.providerKey).toBe("newKey");
  });

  it("allows overriding providerDisplayName", () => {
    const info = new UserLoginInfo("Microsoft", "ms123", "MS Provider");
    info.providerDisplayName = "Custom Display";
    expect(info.providerDisplayName).toBe("Custom Display");
  });
});
