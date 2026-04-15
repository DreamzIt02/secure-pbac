import { describe, it, expect } from "vitest";
import { AuthenticationProperties } from "../../../src/http/authentication/index.js";

describe("AuthenticationProperties", () => {
  it("initializes with empty items and parameters by default", () => {
    const props = new AuthenticationProperties();
    expect(props.items).toEqual({});
    expect(props.parameters).toEqual({});
  });

  it("initializes with provided items and parameters", () => {
    const props = new AuthenticationProperties({ a: "1" }, { b: { value: 2 } });
    expect(props.items.a).toBe("1");
    expect(props.parameters.b).toEqual({ value: 2 });
  });

  it("clone creates a deep copy", () => {
    const props = new AuthenticationProperties({ a: "1" }, { b: { value: 2 } });
    const clone = props.clone();
    expect(clone).not.toBe(props);
    expect(clone.items).toEqual(props.items);
    expect(clone.parameters).toEqual(props.parameters);
    clone.items.a = "changed";
    expect(props.items.a).toBe("1"); // original unchanged
  });

  it("isPersistent getter/setter works", () => {
    const props = new AuthenticationProperties();
    expect(props.isPersistent).toBe(false);
    props.isPersistent = true;
    expect(props.isPersistent).toBe(true);
    props.isPersistent = false;
    expect(props.isPersistent).toBe(false);
  });

  it("redirectUri getter/setter works", () => {
    const props = new AuthenticationProperties();
    expect(props.redirectUri).toBeNull();
    props.redirectUri = "https://example.com";
    expect(props.redirectUri).toBe("https://example.com");
    props.redirectUri = null;
    expect(props.redirectUri).toBeNull();
  });

  it("issuedUtc getter/setter works", () => {
    const props = new AuthenticationProperties();
    expect(props.issuedUtc).toBeNull();
    const now = new Date();
    props.issuedUtc = now;
    expect(props.issuedUtc?.toUTCString()).toBe(now.toUTCString());
    props.issuedUtc = null;
    expect(props.issuedUtc).toBeNull();
  });

  it("expiresUtc getter/setter works", () => {
    const props = new AuthenticationProperties();
    expect(props.expiresUtc).toBeNull();
    const later = new Date(Date.now() + 1000);
    props.expiresUtc = later;
    expect(props.expiresUtc?.toUTCString()).toBe(later.toUTCString());
    props.expiresUtc = null;
    expect(props.expiresUtc).toBeNull();
  });

  it("allowRefresh getter/setter works", () => {
    const props = new AuthenticationProperties();
    expect(props.allowRefresh).toBeNull();
    props.allowRefresh = true;
    expect(props.allowRefresh).toBe(true);
    props.allowRefresh = false;
    expect(props.allowRefresh).toBe(false);
    props.allowRefresh = null;
    expect(props.allowRefresh).toBeNull();
  });

  it("getString and setString work", () => {
    const props = new AuthenticationProperties();
    expect(props.getString("key")).toBeNull();
    props.setString("key", "value");
    expect(props.getString("key")).toBe("value");
    props.setString("key", null);
    expect(props.getString("key")).toBeNull();
  });

  it("getParameter and setParameter work", () => {
    const props = new AuthenticationProperties();
    expect(props.getParameter("param")).toBeUndefined();
    props.setParameter("param", { test: 123 });
    expect(props.getParameter<{ test: number }>("param")).toEqual({ test: 123 });
  });

  it("getBool returns correct values", () => {
    const props = new AuthenticationProperties({ testTrue: "true", testFalse: "false" });
    expect((props as any).getBool("testTrue")).toBe(true);
    expect((props as any).getBool("testFalse")).toBe(false);
    expect((props as any).getBool("missing")).toBeNull();
  });

  it("setBool sets and removes values", () => {
    const props = new AuthenticationProperties();
    (props as any).setBool("flag", true);
    expect(props.items.flag).toBe("true");
    (props as any).setBool("flag", false);
    expect(props.items.flag).toBe("false");
    (props as any).setBool("flag", null);
    expect(props.items.flag).toBeUndefined();
  });

  it("getDateTimeOffset parses valid and invalid dates", () => {
    const props = new AuthenticationProperties();
    const now = new Date();
    (props as any).setDateTimeOffset("date", now);
    const parsed = (props as any).getDateTimeOffset("date");
    expect(parsed?.toUTCString()).toBe(now.toUTCString());

    props.items["badDate"] = "not-a-date";
    expect((props as any).getDateTimeOffset("badDate")).toBeNull();
  });

  it("setDateTimeOffset removes when null", () => {
    const props = new AuthenticationProperties();
    const now = new Date();
    (props as any).setDateTimeOffset("date", now);
    expect(props.items.date).toBe(now.toUTCString());
    (props as any).setDateTimeOffset("date", null);
    expect(props.items.date).toBeUndefined();
  });
});
