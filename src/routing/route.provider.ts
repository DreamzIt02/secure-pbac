import { RouteHandler } from "./route.handler.js";
import { IRouteProvider, RouteResolution } from "./types.js";

import { IncomingMessage } from "http";
import { URL } from "url";

export class RouteProvider implements IRouteProvider {
  constructor(private readonly routes: Map<string, RouteHandler>) {}

  async resolve(req: IncomingMessage): Promise<RouteResolution | null> {
    if (!req.url || !req.method) return null;

    const parsedUrl = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    const pathname = parsedUrl.pathname;
    const segments = pathname.split("/").filter(Boolean);

    for (const [, route] of this.routes) {
      if (route.method !== req.method.toUpperCase()) continue;

      const templateSegments = route.template.split("/").filter(Boolean);
      if (templateSegments.length !== segments.length) continue;

      const routeParams: Record<string, string> = {};
      let matched = true;

      for (let i = 0; i < templateSegments.length; i++) {
        const t = templateSegments[i];
        const s = segments[i];

        if (t.startsWith(":")) {
          routeParams[t.substring(1)] = decodeURIComponent(s);
        } else if (t !== s) {
          matched = false;
          break;
        }
      }

      if (matched) {
        // Query params
        const queryParams: Record<string, string> = {};
        for (const [key, value] of parsedUrl.searchParams.entries()) {
          queryParams[key] = value;
        }

        // Headers
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === "string") headers[key] = value;
        }

        // Body (only for POST/PUT/PATCH)
        let body: unknown = undefined;
        if (["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
          body = await new Promise<string>((resolve, reject) => {
            let data = "";
            req.on("data", chunk => (data += chunk));
            req.on("end", () => resolve(data));
            req.on("error", reject);
          }).then(raw => {
            try {
              return JSON.parse(raw);
            } catch {
              return raw; // fallback to raw string
            }
          });
        }

        return Promise.resolve({
          method  : route.method,
          template: route.template,
          handler : route.handler,
          routeName: route.routeName,
          metadata: route.metadata,
          routeParams,
          queryParams,
          headers,
          body,
        } as RouteResolution);
      }
    }

    return null;
  }
}
