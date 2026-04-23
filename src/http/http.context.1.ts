// http.context.1.ts
import { IncomingMessage, ServerResponse } from "http";
import { AuthenticateResult } from "./authentication/authenticate.result.js";
import { ClaimsIdentity, ClaimsPrincipal } from "../claims/index.js";
import { AuthenticationProperties } from "./authentication/authentication.properties.js";
import {
  ConnectionInfo,
  HttpContext as HttpContextBase,
  IFeatureCollection,
  WebSocketManager
} from "./http.context.js";
import { HttpContextAccessor as HttpContextAccessorBase } from "./http.context.accessor.js";
import { CancellationToken } from "../types/cancellation.js";
import { IServiceProvider, ISession } from "../features/index.js";

/**
 * Encapsulates HTTP-specific information about an individual request.
 *
 * This is a lightweight wrapper around Node.js request/response objects,
 * providing a unified context similar to ASP.NET Core's HttpContext.
 */
export class NodeHttpContext extends HttpContextBase {
  public features: IFeatureCollection;
  public connection: ConnectionInfo;
  public webSockets: WebSocketManager;
  public user: ClaimsPrincipal;
  public items: Map<object, object | null>;
  public requestServices: IServiceProvider;
  public requestAborted: CancellationToken;
  public traceIdentifier: string;
  public session: ISession;
  /**
   * The raw Node.js request object.
   */
  public readonly request: IncomingMessage;

  /**
   * The raw Node.js response object.
   */
  public readonly response: ServerResponse;

  /**
   * Optional feature slot for storing the last authenticate result.
   * Mirrors ASP.NET's IAuthenticateResultFeature.
   */
  public authenticateResultFeature?: { authenticateResult: AuthenticateResult };

  // Add these tracking properties
  public signedIn?: { scheme: string; principal: ClaimsPrincipal; props: AuthenticationProperties };
  public signedOut?: string;

  constructor(req: IncomingMessage, res: ServerResponse) {
    super();
    this.request  = req;
    this.response = res;

    // Initialize all members with default values
    this.features   = {} as IFeatureCollection;
    this.connection = {} as ConnectionInfo;
    this.webSockets = {} as WebSocketManager;
    this.user = new ClaimsPrincipal([]);
    this.items = new Map<object, object | null>();
    this.requestServices = {} as IServiceProvider;
    this.requestAborted = new CancellationToken();
    this.traceIdentifier = req.url ?? "";
    this.session = {} as ISession;
  }

  /**
   * Simulates authentication for a given scheme.
   * In a real app, we’d plug in Passport.js, JWT validation, etc.
   */
  async authenticateAsync(scheme: string): Promise<AuthenticateResult> {
    const authHeader = this.request.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length);
      // FIXME: validate token according to scheme
      console.log('TOKEN', token)
      const principal = new ClaimsPrincipal([new ClaimsIdentity([], scheme)]);
      const ticket = { principal, properties: { expiresUtc: new Date(Date.now() + 3600 * 1000) } };
      const result = AuthenticateResult.success(ticket as any);
      this.authenticateResultFeature = { authenticateResult: result };
      return result;
    }

    const result = AuthenticateResult.noResult();
    this.authenticateResultFeature = { authenticateResult: result };
    return result;
  }

  /**
   * Aborts the request by destroying the underlying connection.
   */
  abort(): void {
    this.request.destroy();
  }

  async signInAsync(
    authenticationScheme: string,
    userPrincipal: ClaimsPrincipal,
    authenticationProperties: AuthenticationProperties
  ): Promise<void> {
    // FIXME: Minimal implementation: just record the call
    this.signedIn = { scheme: authenticationScheme, principal: userPrincipal, props: authenticationProperties };
  }

  async signOutAsync(authenticationScheme: string): Promise<void> {
    // FIXME: Minimal implementation: just record the scheme
    this.signedOut = authenticationScheme;
  }
}

/**
 * Provides access to the current HttpContext using AsyncLocalStorage.
 *
 * Mirrors ASP.NET Core's IHttpContextAccessor.
 */
export class NodeHttpContextAccessor extends HttpContextAccessorBase {
  /**
   * Runs a callback within the scope of a given HttpContext.
   * Ensures that NodeHttpContextAccessor.current returns the correct context inside async calls.
   */
  static runWithContext<T>(context: NodeHttpContext, callback: () => T): T {
    return this.httpContextCurrent.run(this.factory(context), callback);
  }

  /**
   * Gets the current HttpContext for the executing async flow.
   */
  static get current(): NodeHttpContext | null {
    return this.httpContextCurrent.getStore()?.context as NodeHttpContext ?? null;
  }
}
