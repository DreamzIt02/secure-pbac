import { describe, it, expect } from "vitest";
import { AuthenticationToken } from "../../../src/http/authentication/index.js";

describe("AuthenticationToken", () => {
  it("has correct default values", () => {
    const token = new AuthenticationToken();
    expect(token.name).toBe("");
    expect(token.value).toBe("");
  });

  it("allows overriding name", () => {
    const token = new AuthenticationToken();
    token.name = "AuthToken";
    expect(token.name).toBe("AuthToken");
  });

  it("allows overriding value", () => {
    const token = new AuthenticationToken();
    token.value = "12345";
    expect(token.value).toBe("12345");
  });

  it("supports updating both name and value together", () => {
    const token = new AuthenticationToken();
    token.name = "RefreshToken";
    token.value = "abcdef";
    expect(token.name).toBe("RefreshToken");
    expect(token.value).toBe("abcdef");
  });
});
