
// ## 🪪 3. Injection Token System
export type Token<T = any> = symbol | (new (...args: any[]) => T);

// export const multi = (token: Token) => ({
//   token,
//   multi: true
// });

// # 🧬 4. @Inject Decorator (Parameter Injection Override)
const INJECT_METADATA_KEY = Symbol("inject_tokens");

// export function Inject(token: Token): ParameterDecorator {
//   return (target, propertyKey, parameterIndex) => {
//     const existing =
//       Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};

//     existing[parameterIndex] = token;

//     Reflect.defineMetadata(INJECT_METADATA_KEY, existing, target);
//   };
// }

export function Inject(token: Token): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    // if (!name || !name.length)
    //   throw new Error(`A valid parameter name is required: ${name}`);

    // target here is the constructor function
    const ctor = target as any;

    // Initialize metadata store if not present
    if (!ctor[INJECT_METADATA_KEY]) {
      ctor[INJECT_METADATA_KEY] = {};
    }
    
    // if (ctor[INJECT_METADATA_KEY][name])
    //   throw new Error(`A valid parameter name is already injected: ${name}`);

    // Store the token for this parameter index
    ctor[INJECT_METADATA_KEY][parameterIndex] = token;
  };
}

// Helper to read tokens later
export function getInjectTokens(ctor: Function): Record<number, Token> {
  return (ctor as any)[INJECT_METADATA_KEY] || {};
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

