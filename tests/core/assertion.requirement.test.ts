import {
  AssertionRequirement,
  AuthorizationHandlerContext,
} from "../../src/core/index.js";

describe("AssertionRequirement", () => {
  it("should throw if handler is null", () => {
    expect(() => new AssertionRequirement(null as any)).toThrow(
      "handler cannot be null"
    );
  });

  it("should wrap synchronous handler into async", async () => {
    const req = new AssertionRequirement(() => true);
    const result = await req.handler({} as AuthorizationHandlerContext);
    expect(result).toBe(true);
  });

  it("should wrap asynchronous handler correctly", async () => {
    const req = new AssertionRequirement(async () => true);
    const result = await req.handler({} as AuthorizationHandlerContext);
    expect(result).toBe(true);
  });

  it("handleAsync should succeed when handler returns true", async () => {
    const context: any = {
      succeed: vi.fn(),
    };
    const req = new AssertionRequirement(() => true);
    await req.handleAsync(context as AuthorizationHandlerContext);
    expect(context.succeed).toHaveBeenCalledWith(req);
  });

  it("handleAsync should not succeed when handler returns false", async () => {
    const context: any = {
      succeed: vi.fn(),
    };
    const req = new AssertionRequirement(() => false);
    await req.handleAsync(context as AuthorizationHandlerContext);
    expect(context.succeed).not.toHaveBeenCalled();
  });

  it("toString should return expected message", () => {
    const req = new AssertionRequirement(() => true);
    expect(req.toString()).toBe("Handler assertion should evaluate to true.");
  });
});
