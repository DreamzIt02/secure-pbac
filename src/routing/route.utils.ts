import { HttpMethod } from "../http/index.js";

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
