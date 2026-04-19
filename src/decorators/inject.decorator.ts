
// ## 🪪 3. Injection Token System
export type Token<T = any> = symbol | (new (...args: any[]) => T);

// export const multi = (token: Token) => ({
//   token,
//   multi: true
// });

// # 🧬 4. @Inject Decorator (Parameter Injection Override)
const INJECT_TOKENS       = Symbol("INJECT_TOKENS");
const INJECT_METADATA_KEY = Symbol("INJECT_METADATA");

export function Injectable(): ClassDecorator {
  return (target: Object) => {
    // target here is the constructor function
    const ctor = target;
    getInjectableToken(ctor);
  };
}
function getTokenName(ctor: Object | Function): string {
    const descriptors = Object.getOwnPropertyDescriptors(
      typeof ctor === "function" ? ctor : Object.getPrototypeOf(ctor));
    const name: string = descriptors.name.value;
      if (!name || !name.length)
        throw new Error(`A valid parameter name is required: ${name}`);

    return name;
  }

export function getInjectableToken(ctor: Object | Function): Token {
  if (typeof ctor !== "object" || typeof ctor !== "function")
    return ctor as any;

  const name = getTokenName(ctor);
  
  const existing = Reflect.get(ctor, INJECT_TOKENS) ?? {};
  if (existing[name])
    return existing[name];

  const token = Symbol(name);
  existing[name] = token;

  Reflect.defineProperty(ctor, INJECT_TOKENS, {
    value: existing,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  return Reflect.get(ctor, INJECT_TOKENS);
}

export function Inject<T>(token: Token<T>): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    // if (!name || !name.length)
    //   throw new Error(`A valid parameter name is required: ${name}`);

    // target here is the constructor function
    const ctor = target;
    const existing = Reflect.get(ctor, INJECT_METADATA_KEY) ?? {};

    // if (ctor[INJECT_METADATA_KEY][name])
    //   throw new Error(`A valid parameter name is already injected: ${name}`);

    // Store the token for this parameter index
    existing[parameterIndex] = token;

    Reflect.defineProperty(ctor, INJECT_METADATA_KEY, {
      value: existing,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  };
}

// Helper to read tokens later
export function getInjectTokens(ctor: Function): Record<number, Token> {
  return Reflect.get(ctor, INJECT_METADATA_KEY) || {};
}
// # Usage Examples
// class Logger {}
// class UserService {
//   constructor(@Inject(Logger) private logger: Logger) {}
// }

// // Later in ServiceProvider.createInstance:
// const injectTokens = getInjectTokens(UserService);
// const params = Object.keys(injectTokens).map(i => provider.getService(injectTokens[i]));
// const instance = new UserService(...params);

