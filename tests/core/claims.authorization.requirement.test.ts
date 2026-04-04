import {
  ClaimsAuthorizationRequirement,
  AuthorizationHandlerContext,
} from "../../src/core/index.js";
import {
  IAuthorizationRequirement,
  IAuthorizationHandler,
} from "../../src/core/types.js";

describe("ClaimsAuthorizationRequirement", () => {
  it("should throw if claimType is null or empty", () => {
    expect(() => new ClaimsAuthorizationRequirement("")).toThrow(
      "claimType cannot be null or empty"
    );
  });

  it("should succeed when claim type exists and no allowed values specified", async () => {
    const requirement = new ClaimsAuthorizationRequirement("email");
    const context: any = {
      user: { claims: [{ type: "email", value: "test@example.com" }] },
      succeed: vi.fn(),
    };
    await requirement["handleRequirementAsync"](context, requirement);
    expect(context.succeed).toHaveBeenCalledWith(requirement);
  });

  it("should not succeed when claim type does not exist", async () => {
    const requirement = new ClaimsAuthorizationRequirement("email");
    const context: any = {
      user: { claims: [{ type: "name", value: "bob" }] },
      succeed: vi.fn(),
    };
    await requirement["handleRequirementAsync"](context, requirement);
    expect(context.succeed).not.toHaveBeenCalled();
  });

  it("should succeed when claim type and allowed value match", async () => {
    const requirement = new ClaimsAuthorizationRequirement("role", ["admin"]);
    const context: any = {
      user: { claims: [{ type: "role", value: "admin" }] },
      succeed: vi.fn(),
    };
    await requirement["handleRequirementAsync"](context, requirement);
    expect(context.succeed).toHaveBeenCalledWith(requirement);
  });

  it("should not succeed when claim type matches but value not allowed", async () => {
    const requirement = new ClaimsAuthorizationRequirement("role", ["admin"]);
    const context: any = {
      user: { claims: [{ type: "role", value: "user" }] },
      succeed: vi.fn(),
    };
    await requirement["handleRequirementAsync"](context, requirement);
    expect(context.succeed).not.toHaveBeenCalled();
  });

  it("toString should include allowed values when provided", () => {
    const requirement = new ClaimsAuthorizationRequirement("role", ["admin", "user"]);
    expect(requirement.toString()).toBe(
      "ClaimsAuthorizationRequirement:Claim.Type=role and Claim.Value is one of the following values: (admin|user)"
    );
  });

  it("toString should not include allowed values when none provided", () => {
    const requirement = new ClaimsAuthorizationRequirement("email");
    expect(requirement.toString()).toBe(
      "ClaimsAuthorizationRequirement:Claim.Type=email"
    );
  });

  it("isRequirementType should return true for ClaimsAuthorizationRequirement", () => {
    const requirement = new ClaimsAuthorizationRequirement("email");
    expect(requirement["isRequirementType"](requirement)).toBe(true);
  });

  it("isRequirementType should return false for other requirement types", () => {
    const requirement = new ClaimsAuthorizationRequirement("email");
    const otherRequirement: IAuthorizationRequirement = { toString: () => "Other" };
    expect(requirement["isRequirementType"](otherRequirement)).toBe(false);
  });
});
