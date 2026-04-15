import { describe, it, expect } from "vitest";
import { HttpContext } from "../../src/http/http.context.js";
import { HttpContextAccessor } from "../../src/http/http.context.accessor.js";

// Minimal concrete subclass for testing
class TestHttpContext extends HttpContext {
  public features: any = {};
  public request: any = { url: "/test" };
  public response: any = { statusCode: 200 };
  public connection: any = {};
  public webSockets: any = {};
  public user: any = {};
  public items: Map<object, object | null> = new Map();
  public requestServices: any = {};
  public requestAborted: any = {};
  public traceIdentifier: string = "trace-123";
  public session: any = {};
  public abort(): void {}
}

describe("HttpContextAccessor", () => {
  it("returns null when no context is set", () => {
    const accessor = new HttpContextAccessor();
    expect(accessor.httpContext).toBeNull();
  });

  it("sets and gets httpContext correctly", () => {
    const accessor = new HttpContextAccessor();
    const ctx = new TestHttpContext();
    accessor.httpContext = ctx;
    expect(accessor.httpContext).toBe(ctx);
  });

  it("clears previous context when setting new one", () => {
    const accessor = new HttpContextAccessor();
    const ctx1 = new TestHttpContext();
    const ctx2 = new TestHttpContext();

    accessor.httpContext = ctx1;
    expect(accessor.httpContext).toBe(ctx1);

    accessor.httpContext = ctx2;
    expect(accessor.httpContext).toBe(ctx2);
    // The old context should be cleared
    expect(HttpContextAccessor["httpContextCurrent"].value!.context).toBe(ctx2);
  });

  it("clears context when set to null", () => {
    const accessor = new HttpContextAccessor();
    const ctx = new TestHttpContext();
    accessor.httpContext = ctx;
    expect(accessor.httpContext).toBe(ctx);

    accessor.httpContext = null;
    expect(accessor.httpContext).toBeNull();
  });
});
