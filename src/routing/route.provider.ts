import { RouteHandler } from "./route.handler.js";
import { IRouteProvider, RouteResolution } from "./types.js";

import { IncomingMessage } from "http";
import { URL } from "url";

export class RouteProvider implements IRouteProvider {
  constructor(private readonly routes: Map<string, RouteHandler>) {}

  resolve(req: IncomingMessage): RouteResolution | null {
    if (!req.url || !req.method) return null;

    // Use Node’s URL parser to separate path and query
    const parsedUrl = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    const pathname = parsedUrl.pathname;
    const segments = pathname.split("/").filter(Boolean);

    for (const [, route] of this.routes) {
      if (route.method !== req.method.toUpperCase()) continue;

      const templateSegments = route.template.split("/").filter(Boolean);
      if (templateSegments.length !== segments.length) continue;

      const params: Record<string, string> = {};
      let matched = true;

      for (let i = 0; i < templateSegments.length; i++) {
        const t = templateSegments[i];
        const s = segments[i];

        if (t.startsWith(":")) {
          params[t.substring(1)] = decodeURIComponent(s);
        } else if (t !== s) {
          matched = false;
          break;
        }
      }

      if (matched) {
        // Merge query params into the result
        for (const [key, value] of parsedUrl.searchParams.entries()) {
          params[key] = value;
        }

        return { handler: route.handler, params };
      }
    }

    return null;
  }
}


// // routes.ts
// const collection = new RouteCollection();
// collection.add("GET", "/public", (ctx: HttpContext) => {
//   ctx.response.end("Anyone can access data");
// });
// collection.add("GET", "/admin", (ctx: HttpContext) => {
//   ctx.response.end("Admin-only data");
// });
// collection.add("GET", "/finance/:dept", (ctx: HttpContext, dept: string) => {
//   ctx.response.end(`Finance department: ${dept}`);
// });

// const provider = collection.build();

// // pipeline.ts
// const resolution = provider.resolve(context.request.url, context.request.method);
// if (resolution) {
//   const { handler, params } = resolution;
//   context.routeParams = params;
//   handler(context, ...Object.values(params));
// } else {
//   context.response.statusCode = 404;
//   context.response.end("Not Found");
// }
