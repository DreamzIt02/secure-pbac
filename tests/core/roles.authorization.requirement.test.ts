import {
  RolesAuthorizationRequirement,
  AuthorizationHandlerContext,
} from "../../src/core/index.js";
import {
  IAuthorizationRequirement,
  IAuthorizationHandler,
} from "../../src/core/types.js";

describe("RolesAuthorizationRequirement", () => {
  it("should throw if roles is null or empty", () => {
    expect(() => new RolesAuthorizationRequirement([])).toThrow(
      "roles cannot be null or empty"
    );
    expect(() => new RolesAuthorizationRequirement(null as any)).toThrow(
      "roles cannot be null or empty"
    );
  });

  it("should expose AllowedRoles", () => {
    const req = new RolesAuthorizationRequirement(["admin", "user"]);
    expect(req.AllowedRoles).toEqual(["admin", "user"]);
  });

  it("should succeed when user has one of the allowed roles", async () => {
    const req = new RolesAuthorizationRequirement(["admin", "user"]);
    const context: any = {
      user: { roles: ["user"] },
      succeed: vi.fn(),
    };
    await req["handleRequirementAsync"](context, req);
    expect(context.succeed).toHaveBeenCalledWith(req);
  });

  it("should succeed when user role matches case-insensitively", async () => {
    const req = new RolesAuthorizationRequirement(["Admin"]);
    const context: any = {
      user: { roles: ["admin"] },
      succeed: vi.fn(),
    };
    await req["handleRequirementAsync"](context, req);
    expect(context.succeed).toHaveBeenCalledWith(req);
  });

  it("should not succeed when user has no allowed roles", async () => {
    const req = new RolesAuthorizationRequirement(["admin"]);
    const context: any = {
      user: { roles: ["guest"] },
      succeed: vi.fn(),
    };
    await req["handleRequirementAsync"](context, req);
    expect(context.succeed).not.toHaveBeenCalled();
  });

  it("should not succeed when context has no User", async () => {
    const req = new RolesAuthorizationRequirement(["admin"]);
    const context: any = {
      user: null,
      succeed: vi.fn(),
    };
    await req["handleRequirementAsync"](context, req);
    expect(context.succeed).not.toHaveBeenCalled();
  });

  it("toString should list allowed roles", () => {
    const req = new RolesAuthorizationRequirement(["admin", "user"]);
    expect(req.toString()).toBe(
      "RolesAuthorizationRequirement: Requires user in one of the roles (admin|user)"
    );
  });

  it("isRequirementType should return true for RolesAuthorizationRequirement", () => {
    const req = new RolesAuthorizationRequirement(["admin"]);
    expect(req["isRequirementType"](req)).toBe(true);
  });

  it("isRequirementType should return false for other requirement types", () => {
    const req = new RolesAuthorizationRequirement(["admin"]);
    const otherRequirement: IAuthorizationRequirement = { toString: () => "Other" };
    expect(req["isRequirementType"](otherRequirement)).toBe(false);
  });
});
