
export enum HttpMethod {
  GET   = "GET",
  POST  = "POST",
  PUT   = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
  HEAD  = "HEAD"
}

export class RequestHandler {

}

export class RequestParams {
  public readonly headers    : Record<string, string>;
  public readonly routeParams: Record<string, string>;
  public readonly queryParams: Record<string, string>;
  private readonly _body?: unknown; // parsed JSON or raw string

  /**
   *
   */
  constructor(
    headers    : Record<string, string>,
    routeParams: Record<string, string>,
    queryParams: Record<string, string>,
  ) {
    this.headers     = headers;
    this.routeParams = routeParams;
    this.queryParams = queryParams;
  }
  public get body() {
    return (this._body as any);
  }
  public set body(value: any) {
    (this._body as any) = value;
  }
}

export class RequestMeta {
  public readonly method  : string;
  public readonly template: string;

  /**
   *
   */
  constructor(method: string, template: string) {
    this.method   = method;
    this.template = template;
  }
}
