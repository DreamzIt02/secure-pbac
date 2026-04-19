import { IncomingMessage } from "http";

export type HandlerFn = (...args: any[]) => void;
export type BindingSource = "route" | "query" | "body" | "header";

export interface IRouteProvider {
  resolve(req: IncomingMessage): Promise<RouteResolution | null>;
}

export interface RouteResolution {
  readonly method  : string,
  readonly template: string,
  readonly routeName : string,
  readonly metadata: Record<string, any>;
  readonly handler : HandlerFn;
  readonly routeParams: Record<string, string>;
  readonly queryParams: Record<string, string>;
  readonly headers: Record<string, string>;
  readonly body?  : unknown; // parsed JSON or raw string
}


export interface ParamBinding {
  index : number;
  source: BindingSource;
  name? : string;
}

export interface RouteMetadata {
  propertyKey: string;
  basePath  : string;
  method    : string;
  template  : string;
  routes?   : RouteMetadata[];
  // Key value pair -> propertyKey: ParamBinding[]
  params?   : Record<string, ParamBinding[]>;
}
