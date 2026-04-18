

import { ClaimsPrincipal } from "../claims/index.js";
import { CancellationToken } from "../types/cancellation.js";
import { HttpRequest, HttpResponse } from "./types.js";
import { IServiceProvider, ISession } from "../features/index.js";

export interface IFeatureCollection {
  entries(): Iterable<[object, object]> | ArrayLike<[object, object]>;
}
export interface ConnectionInfo {}
export interface WebSocketManager {}

/**
 * Encapsulates all HTTP-specific information about an individual HTTP request.
 */
export abstract class HttpContext {
  /**
   * Gets the collection of HTTP features provided by the server and middleware available on this request.
   */
  public abstract features: IFeatureCollection;

  /**
   * Gets the HttpRequest object for this request.
   */
  public abstract request: HttpRequest;

  /**
   * Gets the HttpResponse object for this request.
   */
  public abstract response: HttpResponse;

  /**
   * Gets information about the underlying connection for this request.
   */
  public abstract connection: ConnectionInfo;

  /**
   * Gets an object that manages the establishment of WebSocket connections for this request.
   */
  public abstract webSockets: WebSocketManager;

  /**
   * Gets or sets the user for this request.
   */
  public abstract user: ClaimsPrincipal;

  /**
   * Gets or sets a key/value collection that can be used to share data within the scope of this request.
   */
  public abstract items: Map<object, object | null>;

  /**
   * Gets or sets the IServiceProvider that provides access to the request's service container.
   */
  public abstract requestServices: IServiceProvider;

  /**
   * Notifies when the connection underlying this request is aborted and thus request operations should be cancelled.
   */
  public abstract requestAborted: CancellationToken;

  /**
   * Gets or sets a unique identifier to represent this request in trace logs.
   */
  public abstract traceIdentifier: string;

  /**
   * Gets or sets the object used to manage user session data for this request.
   */
  public abstract session: ISession;

  /**
   * Aborts the connection underlying this request.
   */
  public abstract abort(): void;

  /**
   * Internal debugger string representation.
   */
  protected debuggerToString(): string {
    return HttpContextDebugFormatter.contextToString(this, null);
  }
}

/**
 * Debug view for HttpContext.
 */
export class HttpContextDebugView {
  private readonly context: HttpContext;

  constructor(context: HttpContext) {
    this.context = context;
  }

  public get features(): HttpContextFeatureDebugView {
    return new HttpContextFeatureDebugView(this.context.features);
  }

  public get request(): HttpRequest {
    return this.context.request;
  }

  public get response(): HttpResponse {
    return this.context.response;
  }

  public get connection(): ConnectionInfo {
    return this.context.connection;
  }

  public get webSockets(): WebSocketManager {
    return this.context.webSockets;
  }

  public get user(): ClaimsPrincipal {
    return this.context.user;
  }

  public get items(): Map<object, object | null> {
    return this.context.items;
  }

  public get requestAborted(): CancellationToken {
    return this.context.requestAborted;
  }

  public get requestServices(): IServiceProvider {
    return this.context.requestServices;
  }

  public get traceIdentifier(): string {
    return this.context.traceIdentifier;
  }

  public get session(): ISession | null {
    return this.context.session;
  }
}

/**
 * Debug view for HttpContext features.
 */
export class HttpContextFeatureDebugView {
  private readonly features: IFeatureCollection;

  constructor(features: IFeatureCollection) {
    this.features = features;
  }

  public get items(): Array<[object, object]> {
    return Array.from(this.features.entries());
  }
}

/**
 * Stub for HttpContextDebugFormatter.
 */
export class HttpContextDebugFormatter {
  public static contextToString(context: HttpContext, reasonPhrase: string | null): string {
    return `HttpContext TraceIdentifier=${context.traceIdentifier}`;
  }
}
