
export function AllowAnonymous(): Function {
  return function (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {

    const fn = descriptor ? descriptor.value : target;

    Reflect.defineProperty(fn, "__allowAnonymous", {
        value: true,
        writable: false,
        enumerable: false,
        configurable: true,
    });
  };
}