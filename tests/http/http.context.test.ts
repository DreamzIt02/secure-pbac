import { describe, it, expect } from "vitest";
import { HttpContext, HttpContextDebugFormatter, HttpContextDebugView, HttpContextFeatureDebugView } from "../../src/http/http.context.js";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { CancellationToken } from "../../src/types/cancellation.js";

// Minimal concrete subclass for testing
class TestHttpContext extends HttpContext {
  public features = { entries: () => [[{ key: "f" }, { value: "v" }]] } as any;
  public request = { url: "/test" } as any;
  public response = { statusCode: 200 } as any;
  public connection = {} as any;
  public webSockets = {} as any;
  public user = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "tester")]));
  public items = new Map<object, object | null>([[{ k: "x" }, { value: "y" }]]);
  public requestServices = {} as any;
  public requestAborted = new CancellationToken();
  public traceIdentifier = "trace-123";
  public session = {} as any;
  public abortCalled = false;
  abort(): void {
    this.abortCalled = true;
  }
}

describe("HttpContext and debug views", () => {
  it("debuggerToString returns trace identifier", () => {
    const ctx = new TestHttpContext();
    const str = (ctx as any).debuggerToString();
    expect(str).toContain("trace-123");
  });

  it("HttpContextDebugView exposes properties", () => {
    const ctx = new TestHttpContext();
    const view = new HttpContextDebugView(ctx);
    expect(view.request.url).toBe("/test");
    expect(view.response.statusCode).toBe(200);
    expect(view.connection).toBe(ctx.connection);
    expect(view.webSockets).toBe(ctx.webSockets);
    expect(view.user.identity?.name).toBe("tester");
    expect(view.items.size).toBe(1);
    expect(view.requestAborted).toBeInstanceOf(CancellationToken);
    expect(view.requestServices).toBe(ctx.requestServices);
    expect(view.traceIdentifier).toBe("trace-123");
    expect(view.session).toBe(ctx.session);
  });

  it("HttpContextFeatureDebugView exposes items", () => {
    const ctx = new TestHttpContext();
    const featureView = new HttpContextFeatureDebugView(ctx.features);
    const items = featureView.items;
    expect(items[0][0]).toEqual({ key: "f" });
    expect(items[0][1]).toEqual({ value: "v" });
  });

  it("HttpContextDebugFormatter.contextToString returns string with traceIdentifier", () => {
    const ctx = new TestHttpContext();
    const formatter = HttpContextDebugFormatter;
    const str = formatter.contextToString(ctx, null);
    expect(str).toContain("HttpContext TraceIdentifier=trace-123");
  });

  it("abort sets abortCalled flag", () => {
    const ctx = new TestHttpContext();
    ctx.abort();
    expect(ctx.abortCalled).toBe(true);
  });
});
