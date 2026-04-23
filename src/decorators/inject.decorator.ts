
// ## 🪪 3. Injection Token System
export type Token<T = any> = symbol | (new (...args: any[]) => T);

export type InjectedToken<T> =
  | { kind: "single"; token: Token<T> }
  | { kind: "multi"; tokens: readonly Token<T>[] };

// # 🧬 4. @Inject Decorator (Parameter Injection Override)
const INJECT_TOKENS   = Symbol("INJECT_TOKENS");
const INJECT_METADATA = "INJECT_METADATA";

const getTokenKey = (tokenName: string) => INJECT_METADATA + ":" + tokenName;

export function Injectable(): ClassDecorator {
  return (target: Object) => {
    // target here is the constructor function
    const ctor = target;
    getInjectableToken(ctor);
  };
}

export function getTokenName(ctor: Object | Function): string {
  const descriptors = Object.getOwnPropertyDescriptors(
    typeof ctor === "function" ? ctor : Object.getPrototypeOf(ctor));

  const name: string = descriptors.name.value;
  if (!name || !name.length)
    throw new Error(`A valid parameter name is required: ${name}`);

  return name;
}
// FIXME: this functionality is unclear, or maybe its not strictly used for token symbol creation
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

export function Inject<T>(token: Token<T> | Token<T>[]): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    // FIXME: We need to use propertyKey (if not undefined), so then we can resolve injection in controller method (route) as well
    // Now it all fallback to target (class) constructor

    // target here is the constructor function
    const ctor = target as Function;
    const tokenName = getTokenName(ctor);
    const tokenKey  = getTokenKey(tokenName);
    const existing: Record<number, InjectedToken<T>> = getInjectTokens(ctor) ?? {};

    // if (ctor[INJECT_METADATA_KEY][name])
    //   throw new Error(`A valid parameter name is already injected: ${name}`);

    // Store the token for this parameter index
    if (Array.isArray(token)) {
      existing[parameterIndex] = { kind: "multi", tokens: Object.freeze(token) };
    } else {
      existing[parameterIndex] = { kind: "single", token: token };
    }

    Reflect.defineProperty(ctor, tokenKey, {
      value: existing,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  };
}

// Helper to read tokens later
export function getInjectTokens<T = any>(ctor: Function): Record<number, InjectedToken<T>> {  
  const tokenName = getTokenName(ctor);
  const tokenKey  = getTokenKey(tokenName);
  return Reflect.get(ctor, tokenKey) || {};
}

export function getInjectToken<T = any>(tokens: Record<number, InjectedToken<T>>, index: number | any): Token {
  const injected = tokens[Number(index)];
  if (injected.kind === "multi")
    return injected.tokens[0];
  return injected.token;
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

