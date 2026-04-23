

// * ✅ Lazy resolution (`resolve()` creates instance only when needed)
// * ✅ Lifetimes:
//   * Singleton
//   * Transient
//   * Scoped (per request)
// * ✅ Factory-based creation
// * ✅ Dependency chaining
// * ✅ No framework

// # ✅ Core Principle (without reflect)
// > **ALL dependencies must come from either:**
// * `@Inject()` metadata (`getInjectTokens`)
// * `descriptor.deps`
// No fallback. No magic.
import { getInjectableToken, getInjectToken, getInjectTokens, Token } from "../decorators/index.js";

// # 🧩 Step o: Define Global Service Token Factory
// App.tokens.ts

// # 🧩 Step 1: Define Lifetimes
export enum ServiceLifetime {
  Singleton,
  Scoped,
  Transient,
}

// # 🧾 Step 2: Service Descriptor
export type Factory<T> = (provider: IServiceProvider) => T;

export interface ParamDescriptor<T = any> {
  [key: number]: T
}
// # 🧾 5. Service Descriptor
export interface ServiceDescriptor<T = any> {
  token: Token<T>;
  lifetime: ServiceLifetime;
  implementation?: new (...args: any[]) => T;
  factory?: Factory<T>;
  deps?: ParamDescriptor; // explicit dependency values
  // instance?: T; // for singleton
}

// # 🧠 Step 6: IServiceProvider Interface
export interface IServiceProvider {
  getServices<T>(token: Token<T>,         lifetime?: ServiceLifetime): Iterable<T> | null;
  getService<T>(token: Token<T>,          lifetime?: ServiceLifetime): T | null;
  getRequiredService<T>(token: Token<T>,  lifetime?: ServiceLifetime): T;
  createScope(): IServiceProvider;
  dispose(): void;
}

// # 🔥 Step 8: Core Container (Lazy + Scoped)
export class ServiceProvider implements IServiceProvider {
  private readonly descriptorMap  = new Map<Token, ServiceDescriptor[]>();
  private readonly singletonCache = new Map<Token, any>();
  private readonly scopedCache    = new Map<Token, any>();
  // private readonly resolving      = new Set<Token>();

  constructor(
    private readonly descriptors: ServiceDescriptor[],
    private readonly parent?    : ServiceProvider
  ) {
    for (const d of descriptors) {
      if (!this.descriptorMap.has(d.token)) {
        this.descriptorMap.set(d.token, []);
      }
      this.descriptorMap.get(d.token)!.push(d);
    }
    this.validate(); // 🔥 critical
  }

  createScope(): IServiceProvider {
    return new ServiceProvider(this.descriptors, this);
    //```ts
    // const scope = provider.createScope();
    // try {
    //   // run pipeline
    // } finally {
    //   scope.dispose();
    // }
    // ```
  }

  dispose() {
    for (const instance of this.scopedCache.values()) {
      if (typeof instance?.dispose === 'function') {
        instance.dispose();
      }
    }
    this.scopedCache.clear();
  }

  private getAllDescriptors<T>(token: Token<T>): ServiceDescriptor<T>[] {
    //
    token = getInjectableToken(token);

    const local = this.descriptorMap.get(token) ?? [];
    const parent = this.parent ? this.parent.getAllDescriptors(token) : [];
    return [...parent, ...local];
  }
  // private getDescriptor<T>(token: Token): ServiceDescriptor<T> | undefined {
  //   return this.descriptors.find(d => d.token === token);
  // }

  getServices<T>(token: Token<T>, lifetime?: ServiceLifetime, stack: Token[] = []): Iterable<T> {
    //
    token = getInjectableToken(token);

    const matches = this.getAllDescriptors(token).filter(s => !lifetime || lifetime === s.lifetime);

    if (matches.length === 0) return [];

    return matches.map(d => this.resolve(d, stack));
  }
  /**
   * Return null, if no service registered for Token
   * @param token 
   * @returns 
   */
  getService<T>(token: Token<T>, lifetime?: ServiceLifetime, stack: Token[] = []): T | null {
    //
    token = getInjectableToken(token);

    const matches = this.getAllDescriptors(token).filter(s => !lifetime || lifetime === s.lifetime);

    if (matches.length === 0) return null;

    const last = matches[matches.length - 1];
    return this.resolve(last, stack);
  }
  /**
   * Throw if null, throw error if no service registered for Token
   * @param token 
   * @returns 
   */
  getRequiredService<T>(token: Token<T>, lifetime?: ServiceLifetime, stack: Token[] = []): T {
    //
    token = getInjectableToken(token);

    const matches = this.getAllDescriptors(token).filter(s => !lifetime || lifetime === s.lifetime);
    
    if (matches.length === 0)
      throw new Error(`Service not registered: ${token.toString()}`);

    const last = matches[matches.length - 1];
    return this.resolve(last, stack);
  }

  private resolve<T>(descriptor: ServiceDescriptor<T>, stack: Token[] = []): T {

    // 🔥 Circular Dependency Detection
    // if (this.resolving.has(descriptor.token)) {
    //   throw new Error(`Circular dependency detected: ${[...this.resolving.values()].join(' -> ')} -> ${descriptor.token.toString()}`);
    // }
    if (stack.includes(descriptor.token)) {
      throw new Error(`Circular dependency: ${[...stack.map(t => t.toString()), descriptor.token.toString()].join(' -> ')}`);
    }
    if (!this.parent && descriptor.lifetime === ServiceLifetime.Scoped) {
      throw new Error(`Cannot resolve scoped service from root provider`);
    }
    //
    // this.resolving.add(descriptor.token);

    try {
      switch (descriptor.lifetime) {
        // ✅ Singleton
        case ServiceLifetime.Singleton:
          if (this.parent) {
             // delegate to root
            return this.parent.resolve(descriptor);
          }
          if (!this.singletonCache.has(descriptor.token)) {
            this.singletonCache.set(
              descriptor.token,
              this.createInstance(descriptor) as T
            );
          }
          // 👉 Ensures **true root-level singleton**
          return this.singletonCache.get(descriptor.token) as T;
          // if (!descriptor.instance) {
          //   descriptor.instance = this.createInstance(descriptor);
          // }
          // return descriptor.instance;

        // ✅ Scoped
        case ServiceLifetime.Scoped:
          if (this.scopedCache.has(descriptor.token)) {
            return this.scopedCache.get(descriptor.token);
          }
          const scoped = this.createInstance(descriptor);
          this.scopedCache.set(descriptor.token, scoped);
          return scoped;

        // ✅ Transient
        case ServiceLifetime.Transient:
        default:
          return this.createInstance(descriptor);
      }
    } finally {
      // this.resolving.delete(descriptor.token);
    }
  }

  // 🔥 Auto Constructor Injection
  private createInstance<T>(descriptor: ServiceDescriptor<T>, stack: Token[] = []): T {
    if (!descriptor.implementation && !descriptor.factory) {
      throw new Error(`Invalid descriptor for ${descriptor.token.toString()}`);
    }

    if (descriptor.factory) {
      return descriptor.factory(this);
    }

    const ctor = descriptor.implementation!;
    // Read @Inject metadata (index → token mapping)
    const injectTokens = getInjectTokens(ctor);
      
    // Resolve parameters in correct order
    const injected: { [key: string | number]: any } = {};
    Object.keys(injectTokens)
      .map(i => {
        const token = injectTokens[Number(i)];
        const nextStack = [...stack, descriptor.token];

        // If token is an array type, resolve all (like IEnumerable<T> in .NET)
        if (token.kind === "multi") {
          injected[i] = this.getServices(token.tokens[0], undefined, nextStack);
        } else {
          injected[i] = this.getService(token.token, undefined, nextStack);
        }
      });
    
    // resolve deps
    for (const key in descriptor.deps) {
      if (Object.keys(injected).includes(key) || injected[Number(key)] !== undefined)
        throw new Error(`Duplicate params index registered: ${key}`);

        injected[Number(key)] = descriptor.deps[Number(key)];
    }
    
    const params = Object.keys(injected)
      .sort((a, b) => Number(a) - Number(b)) // ensure ascending index order
      .map(i => injected[i])

    return new ctor(...params);
  }

  private validate() {
    // 🔥 lifetime validation
    for (const d of this.descriptors) {
      if (d.lifetime === ServiceLifetime.Singleton) {
        this.checkDependencies(d, new Set(), ServiceLifetime.Singleton);
      }
    }
  }

  private checkDependencies(
    descriptor: ServiceDescriptor,
    visited: Set<Token>,
    rootLifetime: ServiceLifetime
  ) {
    // Factor returns early, already a valid instance should be created
    if (descriptor.factory)
      return;

    const ctor = descriptor.implementation!;
    const injectTokens = getInjectTokens(ctor);

    for (const key of Object.keys(injectTokens)) {
      const token = getInjectToken(injectTokens, key);
      const depDesc = this.getAllDescriptors(token).at(-1);

      if (!depDesc) continue;

      if (rootLifetime === ServiceLifetime.Singleton && depDesc.lifetime === ServiceLifetime.Scoped) {
        throw new Error(
          `Invalid DI: Singleton ${descriptor.token.toString()} depends on Scoped ${token.toString()}`
        );
      }

      if (!visited.has(token)) {
        visited.add(token);
        this.checkDependencies(depDesc, visited, rootLifetime);
      }
    }
  }

}

// # 🪪 Step 6: Define Tokens

// export const AUTHORIZATION_SERVICE = Symbol("AuthorizationService");

// # ⚙️ Step 7: Register Services (Bootstrap)

// ```ts
// class HandlerA {}
// class HandlerB {}

// const services = new ServiceCollection();

// services.addSingleton("Handler", HandlerA); // multi allowed
// services.addSingleton("Handler", HandlerB); // ok

// const provider = services.build();

// const single = provider.getService("Handler"); 
// // → HandlerB (last registered)

// const all = provider.getServices("Handler"); 
// // → [HandlerA, HandlerB]
// ```

// # 🔁 Step 8: Scoped Usage (Per Request)

// ```ts
// const scope = rootProvider.createScope();

// const authService = scope.getService<IAuthorizationService>(
//   AUTHORIZATION_SERVICE
// );
// ```

// # 🧠 Step 9: Use Lazy Resolution in Decorator

// ⚠️ Important: **DO NOT resolve at decorator definition time**

// Decorators run at **load time**, not request time.

// ## ✅ Correct Pattern: Store token, resolve later

// ```ts
// export function AuthorizePolicy(
//   policies?: () => PolicyExpression
// ): Function {
//   return function (target: any, key?: any, descriptor?: any) {

//     const fn = descriptor ? descriptor.value : target;

//     const existing = fn.__requirements || [];

//     Reflect.defineProperty(fn, "__requirements", {
//       value: [
//         ...existing,
//         {
//           type: "policy",
//           policies,
//           token: AUTHORIZATION_SERVICE // 👈 store token only
//         }
//       ],
//       configurable: true
//     });
//   };
// }
// ```

// # 🚀 Step 10: Resolve at Execution Time

// ```ts
// function executeWithAuthorization(fn: Function, provider: IServiceProvider) {
//   const requirements = fn.__requirements || [];

//   for (const req of requirements) {
//     if (req.type === "policy") {
//       const authService = provider.getService<IAuthorizationService>(
//         req.token
//       );

//       const handler = new PolicyDefaultAuthorizationRequirement(
//         req.policies,
//         authService
//       );

//       handler.handle(); // or evaluate
//     }
//   }

//   return fn();
// }
// ```

// # 🔥 What We Just Built (Equivalent to .NET)

// | Feature            | Our Implementation |
// | ------------------ | ------------------- |
// | IServiceCollection | ✅                   |
// | IServiceProvider   | ✅                   |
// | Singleton          | ✅                   |
// | Scoped             | ✅                   |
// | Transient          | ✅                   |
// | Lazy resolution    | ✅                   |
// | Request scope      | ✅                   |
// | Decorator-safe DI  | ✅                   |

// # ⚠️ Critical Insight (Most People Miss This)

// > ❌ Injecting inside decorator = WRONG
// > ✅ Store metadata → resolve during execution
