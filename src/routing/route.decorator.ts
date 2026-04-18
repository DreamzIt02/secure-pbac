import { HttpMethod } from "../http/index.js";
import { normalizeRoutePath } from "./route.utils.js";
import { RouteMetadata } from "./types.js";

const ROUTE_META = "__route_meta";

// Decorator factory
// Decorators are first hits the method, then its class
export function Route(baseOrMethod: string | HttpMethod, template?: string): Function {
  return function (target: any, propertyKey?: string) {
    // Method decorator
    if (propertyKey?.length) {
      if (!baseOrMethod)
        throw new Error(`Method route template cannot be undefined`);

      const templatePath = normalizeRoutePath(template!);

      // Attach metadata directly to the method function
      const ctor = target.constructor;
      // Initialize route list on constructor if not present
      const existing = Reflect.get(ctor, ROUTE_META) ?? { routes: [] };
      // Push method metadata into constructor’s route list
      existing.routes.push(
        { method: String(baseOrMethod) ?? "", propertyKey: propertyKey, basePath: "", template: templatePath } as RouteMetadata);

      Reflect.defineProperty(ctor, ROUTE_META, {
          value: existing,
          writable: false,
          enumerable: false,
          configurable: true,
      });
    }
    // Class decorator
    else if (propertyKey === undefined) {
      if (!baseOrMethod)
        throw new Error(`Class route name cannot be undefined`);

      const basePath = normalizeRoutePath(String(baseOrMethod));
      // Attach metadata directly to constructor
      const ctor = target;
      const existing = (Reflect.get(ctor, ROUTE_META) ?? { routes: [] }) as RouteMetadata;
      existing.basePath = basePath;

      Reflect.defineProperty(ctor, ROUTE_META, {
          value: existing,
          writable: false,
          enumerable: false,
          configurable: true,
      });
    }
  };
}

// Helpers
export function getClassRouteMeta(cls: ClassDecorator | Object): RouteMetadata | undefined {
  return (cls as any)[ROUTE_META];
}

