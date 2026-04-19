import { HttpMethod } from "../http/index.js";
import { getRouteMeta } from "./route.decorator.js";
import { RouteHandler } from "./route.handler.js";
import { RouteProvider } from "./route.provider.js";
import { generateRouteKey, normalizeRoutePath } from "./route.utils.js";
import { RouteMetadata } from "./types.js";

export class RouteCollection {
  private readonly routes: Map<string, RouteHandler> = new Map();

  add(method: HttpMethod, template: string, handler: RouteHandler["handler"], 
        routeName?: string, metadata: Record<string, any> = {}): void {
    //
    template = normalizeRoutePath(template);

    const key = generateRouteKey(method, template);
    if (this.routes.has(key)) {
      throw new Error(`Duplicate route detected: [${method}] ${template}`);
    }

    this.routes.set(key, new RouteHandler(method, template, handler, routeName ?? "", metadata));
  }

  // NEW: register controller class
  addController<T>(controller: T): void {
    const classMeta: RouteMetadata | undefined = getRouteMeta(controller as any);

    if (!classMeta)
      throw new Error(`The controller class must be decorated with @Route()`);
        
    for (const meta of classMeta.routes ?? []) {

      const fn: Function = new (controller as any)()[meta.propertyKey];
      if (!fn) continue;

      // Combine base path + method template
      const fullTemplate = [classMeta.basePath, meta.template].join('/');

      this.add(meta.method as HttpMethod, fullTemplate, fn.bind(controller), 
            meta.propertyKey, {[meta.propertyKey]: classMeta.params?.[meta.propertyKey]});
    }

  }
  build(): RouteProvider {
    return new RouteProvider(this.routes);
  }
}

// ## Example Usage

// ```ts
// collection.add(HttpMethod.GET, "/public", (ctx) => {
//   ctx.response.end("Public data");
// });

// collection.add(HttpMethod.POST, "/users", (ctx) => {
//   ctx.response.end("User created");
// });
// ```
