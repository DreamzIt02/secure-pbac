// http.context.1.ts

import { AsyncLocalStorage } from "async_hooks";
import { IncomingMessage, ServerResponse } from "http";
import { AuthenticateResult } from "./authentication/authenticate.result.js";
import { ClaimsIdentity, ClaimsPrincipal } from "../claims/index.js";
import { AuthenticationProperties } from "./authentication/authentication.properties.js";
import {
  ConnectionInfo,
  HttpContext as HttpContextBase,
  IFeatureCollection,
  IServiceProvider,
  ISession,
  WebSocketManager
} from "./http.context.js";
import { HttpContextAccessor as HttpContextAccessorBase } from "./http.context.accessor.js";
import { CancellationToken } from "../types/cancellation.js";

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

  constructor(req: IncomingMessage, res: ServerResponse) {
    super();
    this.request = req;
    this.response = res;

    // Initialize all members with default values
    this.features = {} as IFeatureCollection;
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

  signInAsync(authenticationScheme: string, userPrincipal: ClaimsPrincipal, authenticationProperties: AuthenticationProperties) {
    throw new Error("Method not implemented.");
  }

  signOutAsync(authenticationScheme: string) {
    throw new Error("Method not implemented.");
  }
}

/**
 * Provides access to the current HttpContext using AsyncLocalStorage.
 *
 * This mirrors the behavior of ASP.NET Core's HttpContextAccessor.
 */
export class NodeHttpContextAccessor extends HttpContextAccessorBase {
  private static storage = new AsyncLocalStorage<NodeHttpContext>();

  /**
   * Runs a callback within the scope of a given HttpContext.
   * This ensures that `NodeHttpContextAccessor.current` will return
   * the correct context inside async calls.
   */
  static runWithContext<T>(context: NodeHttpContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Gets the current HttpContext for the executing async flow.
   */
  static get current(): NodeHttpContext | undefined {
    return this.storage.getStore();
  }
}

// ### 🔑 How to use
// ```ts
// import { createServer } from "http";
// import { HttpContext, HttpContextAccessor } from "./http-context";

// const server = createServer((req, res) => {
//   const context = new HttpContext(req, res);

//   HttpContextAccessor.runWithContext(context, () => {
//     // Inside this callback, HttpContextAccessor.current is available
//     console.log("TraceIdentifier:", HttpContextAccessor.current?.req.url);

//     // we can set user info, items, etc.
//     HttpContextAccessor.current!.user = { id: 123, name: "Alice" };

//     res.writeHead(200);
//     res.end("Hello from HttpContext wrapper!");
//   });
// });

// server.listen(3000);
// ```
