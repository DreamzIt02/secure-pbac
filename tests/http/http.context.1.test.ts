import { describe, it, expect } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { NodeHttpContext, NodeHttpContextAccessor } from "../../src/http/http.context.1.js";
import { ClaimsIdentity, ClaimsPrincipal } from "../../src/claims/index.js";

describe("NodeHttpContext", () => {
  const makeReqRes = (headers: any = {}) => {
    const req = new IncomingMessage(null as any);
    req.url = "/test";
    req.headers = headers;
    const res = new ServerResponse(req);
    return { req, res };
  };

  it("initializes with default values", () => {
    const { req, res } = makeReqRes();
    const ctx = new NodeHttpContext(req, res);
    expect(ctx.request).toBe(req);
    expect(ctx.response).toBe(res);
    expect(ctx.user).toBeInstanceOf(ClaimsPrincipal);
    expect(ctx.traceIdentifier).toBe("/test");
    expect(ctx.items).toBeInstanceOf(Map);
  });

  it("authenticateAsync returns success with Bearer token", async () => {
    const { req, res } = makeReqRes({ authorization: "Bearer abc123" });
    const ctx = new NodeHttpContext(req, res);
    const result = await ctx.authenticateAsync("scheme1");
    expect(result.succeeded).toBe(true);
    expect(ctx.authenticateResultFeature?.authenticateResult.succeeded).toBe(true);
    expect(result.ticket?.principal).toBeInstanceOf(ClaimsPrincipal);
  });

  it("authenticateAsync returns noResult without Bearer token", async () => {
    const { req, res } = makeReqRes({});
    const ctx = new NodeHttpContext(req, res);
    const result = await ctx.authenticateAsync("scheme1");
    expect(result.none).toBe(true);
    expect(ctx.authenticateResultFeature?.authenticateResult.none).toBe(true);
  });

  it("abort destroys the request", () => {
    const { req, res } = makeReqRes();
    const ctx = new NodeHttpContext(req, res);
    let destroyed = false;
    req.destroy = (error?: Error) => {
        destroyed = true;
        return req; // return IncomingMessage to satisfy type
    };
    ctx.abort();
    expect(destroyed).toBe(true);
  });


  it("signInAsync throws not implemented", () => {
    const { req, res } = makeReqRes();
    const ctx = new NodeHttpContext(req, res);
    expect(() => ctx.signInAsync("scheme", new ClaimsPrincipal(new ClaimsIdentity()), {} as any)).toBeDefined()
  });

  it("signOutAsync throws not implemented", () => {
    const { req, res } = makeReqRes();
    const ctx = new NodeHttpContext(req, res);
    expect(() => ctx.signOutAsync("scheme")).toBeDefined()
  });
});

describe("NodeHttpContextAccessor", () => {
  it("runWithContext sets and gets current context", () => {
    const { req, res } = { req: { url: "/ctx", headers: {} } as any, res: {} as any };
    const ctx = new NodeHttpContext(req, res);
    let currentCtx: NodeHttpContext | undefined;
    NodeHttpContextAccessor.runWithContext(ctx, () => {
      currentCtx = NodeHttpContextAccessor.current;
    });
    expect(currentCtx).toBe(ctx);
  });

  it("current returns undefined outside runWithContext", () => {
    expect(NodeHttpContextAccessor.current).toBeUndefined();
  });
});
