import { HttpMethod } from "../http/index.js";
import { normalizeRoutePath } from "./route.utils.js";
import { BindingSource, RouteMetadata } from "./types.js";

const ROUTE_META = "__route_meta";
const PARAM_BINDINGS_KEY = Symbol("param_bindings");

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
      const existing: RouteMetadata = Reflect.get(ctor, ROUTE_META) ?? { routes: [] };
      if (!existing.routes)
        existing.routes = [];

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
      const existing: RouteMetadata = Reflect.get(ctor, ROUTE_META) ?? { routes: [] };
      if (!existing.routes)
        existing.routes = [];

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

export function FromRoute(name?: string) {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    addBinding(target, propertyKey, parameterIndex, "route", name);
  };
}

export function FromQuery(name?: string) {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    addBinding(target, propertyKey, parameterIndex, "query", name);
  };
}

export function FromBody() {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    addBinding(target, propertyKey, parameterIndex, "body");
  };
}

export function FromHeader(name: string) {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    addBinding(target, propertyKey, parameterIndex, "header", name);
  };
}

function addBinding(target: Object | any, propertyKey: string | symbol, index: number, source: BindingSource, name?: string) {
  // Attach metadata directly to constructor
  const ctor = target.constructor;
  const key  = propertyKey.toString();
  const existing: RouteMetadata = Reflect.get(ctor, ROUTE_META) ?? { params: {} };
  if (!existing.params)
    existing.params = {};

  if (!existing.params[key])
    existing.params[key] = [];

  existing.params[key].push({ index, source, name });

  Reflect.defineProperty(ctor, ROUTE_META, {
      value: existing,
      writable: false,
      enumerable: false,
      configurable: true,
  });

}

// Helpers
export function getRouteMeta(cls: ClassDecorator | Object): RouteMetadata | undefined {
  // return (cls as any)[ROUTE_META];
  return Reflect.get(cls, ROUTE_META);
}
// Helpers
export function getRouteParams(cls: ClassDecorator | Object): RouteMetadata | undefined {
  return Reflect.get(cls, PARAM_BINDINGS_KEY);
}