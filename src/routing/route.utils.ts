import { HttpMethod } from "../http/index.js";
import { ParamBinding, RouteResolution } from "./types.js";

export function generateRouteKey(method: HttpMethod, template: string) {
    return `${method} ${template}`;
}
export function normalizeRoutePath(basePath: string): string {
  if (!basePath)
    return "";

  // Normalize template: remove leading slash, remove trailing slash
  if (basePath.startsWith("/")) {
    basePath = basePath.slice(1);
  }
  if (basePath.length > 1 && basePath.endsWith("/")) {
    basePath = basePath.slice(0, -1);
  }

  if(basePath.startsWith("/") || basePath.endsWith("/"))
    throw new Error(`Start with multiple slashes is not valid url`);

  return basePath;
}

export async function invokeWithBindings(handler: Function, routeName: string, resolution: RouteResolution) {
  const bindings: ParamBinding[] = resolution.metadata[routeName] ?? [];
  const args: any[] = [];
  
  for (const binding of bindings) {
    switch (binding.source) {
      case "route":
        args[binding.index] = resolution.routeParams[binding.name ?? ""];
        break;
      case "query":
        args[binding.index] = resolution.queryParams[binding.name ?? ""];
        break;
      case "body":
        args[binding.index] = resolution.body;
        break;
      case "header":
        args[binding.index] = resolution.headers[binding.name ?? ""];
        break;
    }
  }

  return await handler(...args);
}
