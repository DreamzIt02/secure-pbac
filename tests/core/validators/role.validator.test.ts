import { describe, it, expect, beforeEach } from "vitest";
import { RoleValidator } from "../../../src/core/validators/role.validator.js";
import { IdentityErrorDescriber, IdentityResult } from "../../../src/core/identity/index.js";
import { IdentityRole } from "../../../src/core/types/index.js";
import { IRoleManager } from "../../../src/core/identity/index.js";

// Simple test role type
class TestRole extends IdentityRole<string> {
  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }
}

// Fake manager implementing IRoleManager<TestRole>
class FakeRoleManager implements IRoleManager<string, TestRole> {
  constructor(private roleName: string | null, private duplicate: boolean = false) {}

  async getRoleNameAsync(role: TestRole): Promise<string | null> {
    return this.roleName;
  }

  async findByNameAsync(roleName: string): Promise<TestRole | null> {
    if (this.duplicate) {
      return new TestRole("other", roleName);
    }
    return null;
  }

  async getRoleIdAsync(role: TestRole): Promise<string> {
    return role.id;
  }

  // Unused members for this test can be stubbed
  errorDescriber = new IdentityErrorDescriber();
  roles: any;
  supportsQueryableRoles = false;
  supportsRoleClaims = false;
  async createAsync(role: TestRole) { return IdentityResult.success(); }
  async updateAsync(role: TestRole) { return IdentityResult.success(); }
  async deleteAsync(role: TestRole) { return IdentityResult.success(); }
  async roleExistsAsync(roleName: string) { return false; }
  normalizeKey(key: string | null) { return key; }
  async findByIdAsync(roleId: string) { return null; }
  async setRoleNameAsync(role: TestRole, name: string | null) { return IdentityResult.success(); }
  async addClaimAsync(role: TestRole, claim: any) { return IdentityResult.success(); }
  async removeClaimAsync(role: TestRole, claim: any) { return IdentityResult.success(); }
  async getClaimsAsync(role: TestRole) { return []; }
  dispose() {}
}

describe("RoleValidator", () => {
  let validator: RoleValidator<string, TestRole>;

  beforeEach(() => {
    validator = new RoleValidator<string, TestRole>(new IdentityErrorDescriber());
  });

  it("returns success for valid role name", async () => {
    const manager = new FakeRoleManager("Admin");
    const role = new TestRole("1", "Admin");
    const result = await validator.validateAsync(manager, role);
    expect(result.succeeded).toBe(true);
  });

  it("fails for empty role name", async () => {
    const manager = new FakeRoleManager("");
    const role = new TestRole("2", "");
    const result = await validator.validateAsync(manager, role);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidRoleName");
  });

  it("fails for whitespace role name", async () => {
    const manager = new FakeRoleManager("   ");
    const role = new TestRole("3", "   ");
    const result = await validator.validateAsync(manager, role);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidRoleName");
  });

  it("fails for duplicate role name with different id", async () => {
    const manager = new FakeRoleManager("User", true);
    const role = new TestRole("4", "User");
    const result = await validator.validateAsync(manager, role);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("DuplicateRoleName");
  });

  it("returns success when duplicate role has same id", async () => {
    const manager = new FakeRoleManager("Manager");
    manager.findByNameAsync = async () => new TestRole("5", "Manager");
    const role = new TestRole("5", "Manager");
    const result = await validator.validateAsync(manager, role);
    expect(result.succeeded).toBe(true);
  });

  it("throws if manager is null", async () => {
    const role = new TestRole("6", "Guest");
    await expect(validator.validateAsync(null as any, role)).rejects.toThrow();
  });

  it("throws if role is null", async () => {
    const manager = new FakeRoleManager("Guest");
    await expect(validator.validateAsync(manager, null as any)).rejects.toThrow();
  });
});
