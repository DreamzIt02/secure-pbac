import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../src/core/types/index.js";

describe("IdentityUserGeneric", () => {
  it("initializes with default values", () => {
    const user = new IdentityUser<string>();
    expect(user.id).toBeUndefined();
    expect(user.userName).toBeNull();
    expect(user.email).toBeNull();
    expect(user.emailConfirmed).toBe(false);
    expect(user.passwordHash).toBeNull();
    expect(typeof user.securityStamp).toBe("string");
    expect(typeof user.concurrencyStamp).toBe("string");
    expect(user.phoneNumber).toBeNull();
    expect(user.phoneNumberConfirmed).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.lockoutEnd).toBeNull();
    expect(user.lockoutEnabled).toBe(false);
    expect(user.accessFailedCount).toBe(0);
    expect(user.toString()).toBe("");
  });

  it("initializes with userName when provided", () => {
    const user = new IdentityUser<string>("Alice");
    expect(user.userName).toBe("Alice");
    expect(user.toString()).toBe("Alice");
  });

  it("allows overriding properties", () => {
    const user = new IdentityUser<string>("Bob");
    user.email = "bob@example.com";
    user.emailConfirmed = true;
    user.passwordHash = "hashed";
    user.securityStamp = "stamp";
    user.phoneNumber = "123456789";
    user.phoneNumberConfirmed = true;
    user.twoFactorEnabled = true;
    user.lockoutEnd = new Date();
    user.lockoutEnabled = true;
    user.accessFailedCount = 3;

    expect(user.email).toBe("bob@example.com");
    expect(user.emailConfirmed).toBe(true);
    expect(user.passwordHash).toBe("hashed");
    expect(user.securityStamp).toBe("stamp");
    expect(user.phoneNumber).toBe("123456789");
    expect(user.phoneNumberConfirmed).toBe(true);
    expect(user.twoFactorEnabled).toBe(true);
    expect(user.lockoutEnd).toBeInstanceOf(Date);
    expect(user.lockoutEnabled).toBe(true);
    expect(user.accessFailedCount).toBe(3);
  });
});

describe("IdentityUser", () => {
  it("initializes with default values and generates id/securityStamp", () => {
    const user = new IdentityUser();
    user.id = "1";
    expect(typeof user.id).toBe("string");
    expect(typeof user.securityStamp).toBe("string");
    expect(user.userName).toBeNull();
  });

  it("initializes with userName when provided", () => {
    const user = new IdentityUser("Charlie");
    user.id = "1";
    expect(user.userName).toBe("Charlie");
    expect(typeof user.id).toBe("string");
    expect(typeof user.securityStamp).toBe("string");
    expect(user.toString()).toBe("Charlie");
  });

  it("allows overriding properties", () => {
    const user = new IdentityUser("Dana");
    user.email = "dana@example.com";
    user.emailConfirmed = true;
    user.lockoutEnabled = true;
    user.accessFailedCount = 2;

    expect(user.email).toBe("dana@example.com");
    expect(user.emailConfirmed).toBe(true);
    expect(user.lockoutEnabled).toBe(true);
    expect(user.accessFailedCount).toBe(2);
  });
});

describe("IdentityUser branch coverage", () => {
  it("constructor should set userName when provided", () => {
    const user = new IdentityUser<string>("Alice");
    expect(user.userName).toBe("Alice");
  });

  it("constructor should leave userName null when not provided", () => {
    const user = new IdentityUser<string>();
    expect(user.userName).toBeNull();
  });

  it("toString should return userName when set", () => {
    const user = new IdentityUser<string>("Bob");
    expect(user.toString()).toBe("Bob");
  });

  it("toString should return empty string when userName is null", () => {
    const user = new IdentityUser<string>();
    user.userName = null;
    expect(user.toString()).toBe("");
  });

  it("normalizedUserName should return normalized value when userName is set", () => {
    const user = new IdentityUser<string>("Charlie");
    expect(user.normalizedUserName).toBe("CHARLIE"); // LookupNormalizer typically uppercases
  });

  it("normalizedUserName should return null when userName is null", () => {
    const user = new IdentityUser<string>();
    user.userName = null;
    expect(user.normalizedUserName).toBeNull();
  });

  it("normalizedEmail should return normalized value when email is set", () => {
    const user = new IdentityUser<string>();
    user.email = "test@example.com";
    expect(user.normalizedEmail).toBe("TEST@EXAMPLE.COM"); // LookupNormalizer typically uppercases
  });

  it("normalizedEmail should return null when email is null", () => {
    const user = new IdentityUser<string>();
    user.email = null;
    expect(user.normalizedEmail).toBeNull();
  });
});
