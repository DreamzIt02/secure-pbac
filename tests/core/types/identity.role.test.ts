import { describe, it, expect } from "vitest";
import { IdentityRole } from "../../../src/core/types/index.js";

describe("IdentityRole", () => {
  it("initializes with default values", () => {
    const role = new IdentityRole<string>();
    expect(role.name).toBeUndefined();
    expect(typeof role.concurrencyStamp).toBe("string");
    expect(role.toString()).toBe("");
  });

  it("initializes with roleName when provided", () => {
    const role = new IdentityRole<string>("Admin");
    expect(role.name).toBe("Admin");
    expect(role.toString()).toBe("Admin");
  });

  it("allows overriding properties", () => {
    const role = new IdentityRole<string>("User");
    role.id = "role-id";
    role.name = "CustomRole";
    role.concurrencyStamp = "custom-stamp";

    expect(role.id).toBe("role-id");
    expect(role.name).toBe("CustomRole");
    expect(role.concurrencyStamp).toBe("custom-stamp");
    expect(role.toString()).toBe("CustomRole");
  });
});

describe("IdentityRole", () => {
  it("initializes with roleName when provided", () => {
    const role = new IdentityRole("Manager");
    role.id = "1";
    expect(role.name).toBe("Manager");
    expect(typeof role.id).toBe("string");
    expect(typeof role.concurrencyStamp).toBe("string");
    expect(role.toString()).toBe("Manager");
  });

  it("allows overriding properties", () => {
    const role = new IdentityRole("Operator");
    role.id = "custom-id";
    role.name = "CustomOperator";
    role.concurrencyStamp = "custom-stamp";

    expect(role.id).toBe("custom-id");
    expect(role.name).toBe("CustomOperator");
    expect(role.concurrencyStamp).toBe("custom-stamp");
    expect(role.toString()).toBe("CustomOperator");
  });
});
