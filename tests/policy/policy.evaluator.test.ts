import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";
import { HttpContext } from "../../src/http/index.js";
import { AuthorizationPolicy, AuthorizationResult } from "../../src/core/index.js";
import { PolicyEvaluator } from "../../src/policy/index.js";
import { AuthenticateResult, AuthenticationTicket } from "../../src/http/authentication/index.js";
import { IAuthorizationRequirement } from "../../src/core/types/index.js";

/**
 * A stub implementation of IAuthorizationService for testing.
 * It returns either a succeeded or failed AuthorizationResult
 * depending on the constructor arguments.
 */
class DummyAuthorizationService {
  constructor(private succeed: boolean, private failure: any = null) {}

  async authorizeAsync(
    user: ClaimsPrincipal,
    resource: object | null,
    requirements: Iterable<IAuthorizationRequirement> | string
  ): Promise<AuthorizationResult> {
    if (this.succeed)
        return AuthorizationResult.success();
    return AuthorizationResult.failed(this.failure);
  }
}


describe("PolicyEvaluator", () => {
  const makePrincipal = (name = "user") =>
    new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, name)]));

  it("authenticateAsync succeeds with valid scheme and sets user", async () => {
    const req: any = { headers: { authorization: "Bearer token" }, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    const policy = new AuthorizationPolicy([{} as any], ["scheme1"]);

    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(true));
    const result = await evaluator.authenticateAsync(policy, context);

    expect(result.succeeded).toBe(true);
    expect(context.user).toBeInstanceOf(ClaimsPrincipal);
    expect(result.ticket?.authenticationScheme).toContain("scheme1");
  });

  it("authenticateAsync returns noResult when schemes fail", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    const policy = new AuthorizationPolicy([{} as any], ["scheme1"]);

    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(true));
    const result = await evaluator.authenticateAsync(policy, context);

    expect(result.none).toBe(true);
    expect(context.user).toBeInstanceOf(ClaimsPrincipal);
  });

  it("authenticateAsync returns existing authenticateResultFeature when no schemes", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    const policy = new AuthorizationPolicy([{} as any], []);
    const ticket = new AuthenticationTicket(makePrincipal(), null, "context.User");
    context.authenticateResultFeature = { authenticateResult: AuthenticateResult.success(ticket) };

    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(true));
    const result = await evaluator.authenticateAsync(policy, context);

    expect(result.succeeded).toBe(true);
    expect(result.ticket?.authenticationScheme).toBe("context.User");
  });

  it("authenticateAsync uses defaultAuthenticateResult when no feature and user authenticated", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    context.user = makePrincipal("defaultUser");
    const policy = new AuthorizationPolicy([{} as any], []);

    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(true));
    const result = await evaluator.authenticateAsync(policy, context);

    expect(result.succeeded).toBe(true);
    expect(result.ticket?.principal.identity?.name).toBe("defaultUser");
  });

  it("authorizeAsync returns success when authorization succeeds", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    context.user = makePrincipal();
    const policy = new AuthorizationPolicy([{} as any], []);
    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(true));
    const result = await evaluator.authorizeAsync(policy, AuthenticateResult.noResult(), context);

    expect(result.succeeded).toBe(true);
  });

  it("authorizeAsync returns forbid when authentication succeeded but authorization fails", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    context.user = makePrincipal();
    const ticket = new AuthenticationTicket(context.user, null, "scheme");
    const authResult = AuthenticateResult.success(ticket);

    const failure = { reason: "failed" };
    const policy = new AuthorizationPolicy([{} as any], []);
    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(false, failure));
    const result = await evaluator.authorizeAsync(policy, authResult, context);

    expect(result.forbidden).toBe(true);
    expect(result.authorizationFailure).toBe(failure);
  });

  it("authorizeAsync returns challenge when authentication not succeeded and authorization fails", async () => {
    const req: any = { headers: {}, url: "/test" };
    const res: any = {};
    const context = new HttpContext(req, res);
    context.user = makePrincipal();
    const policy = new AuthorizationPolicy([{} as any], []);
    const authResult = AuthenticateResult.noResult();

    const evaluator = new PolicyEvaluator(new DummyAuthorizationService(false));
    const result = await evaluator.authorizeAsync(policy, authResult, context);

    expect(result.challenged).toBe(true);
  });
});
