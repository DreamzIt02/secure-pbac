import { IncomingMessage } from "http";

export type HandlerFn = (...args: any[]) => void;

export interface IRouteProvider {
  resolve(req: IncomingMessage): RouteResolution | null;
}

export interface RouteResolution {
  handler: HandlerFn;
  params: Record<string, string>;
}

export interface RouteMetadata {
  propertyKey: string;
  basePath: string;
  method: string;
  template: string;
  routes?: RouteMetadata[];
}
