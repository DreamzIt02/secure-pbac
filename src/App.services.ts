
// * ✅ Lazy resolution (`resolve()` creates instance only when needed)
// * ✅ Lifetimes:

//   * Singleton
//   * Transient
//   * Scoped (per request)
// * ✅ Factory-based creation
// * ✅ Dependency chaining
// * ✅ No framework

// # 🧩 Step o: Define Global Service Token Factory

// # 🧩 Step 1: Define Lifetimes

export enum ServiceLifetime {
  Singleton,
  Transient,
  Scoped,
}

// # 🧾 Step 2: Service Descriptor

type Factory<T> = (provider: IServiceProvider) => T;

export interface ServiceDescriptor<T = any> {
  token: symbol;
  lifetime: ServiceLifetime;
  factory: Factory<T>;
  instance?: T; // for singleton
}

// # 🧠 Step 3: IServiceProvider Interface

export interface IServiceProvider {
  resolve<T>(token: symbol): T;
  createScope(): IServiceProvider;
}

// # 🔥 Step 4: Core Container (Lazy + Scoped)

export class ServiceProvider implements IServiceProvider {
  private descriptors = new Map<symbol, ServiceDescriptor>();
  private scopedInstances = new Map<symbol, any>();

  constructor(
    descriptors: ServiceDescriptor[],
    private parent?: ServiceProvider
  ) {
    for (const d of descriptors) {
      this.descriptors.set(d.token, d);
    }
  }

  resolve<T>(token: symbol): T {
    const descriptor =
      this.descriptors.get(token) ??
      this.parent?.descriptors.get(token);

    if (!descriptor) {
      throw new Error(`Service not registered: ${token.toString()}`);
    }

    // 🔹 Singleton
    if (descriptor.lifetime === ServiceLifetime.Singleton) {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory(this);
      }
      return descriptor.instance;
    }

    // 🔹 Scoped
    if (descriptor.lifetime === ServiceLifetime.Scoped) {
      if (this.scopedInstances.has(token)) {
        return this.scopedInstances.get(token);
      }

      const instance = descriptor.factory(this);
      this.scopedInstances.set(token, instance);
      return instance;
    }

    // 🔹 Transient
    return descriptor.factory(this);
  }

  createScope(): IServiceProvider {
    return new ServiceProvider([], this);
  }
}

// # 🏗️ Step 5: Service Collection (Builder like .NET)

export class ServiceCollection {
  private descriptors: ServiceDescriptor[] = [];

  addSingleton<T>(token: symbol, factory: Factory<T>) {
    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Singleton,
      factory,
    });
  }

  addScoped<T>(token: symbol, factory: Factory<T>) {
    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Scoped,
      factory,
    });
  }

  addTransient<T>(token: symbol, factory: Factory<T>) {
    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Transient,
      factory,
    });
  }
  /**
   * Merge and Unified service collection
   * @param other 
   * @returns 
   */
  merge(other: ServiceCollection): ServiceCollection {
    this.descriptors = [...this.descriptors, ...other.descriptors]
    other = this;
    return this;
  }

  build(): ServiceProvider {
    return new ServiceProvider(this.descriptors);
  }
}

// # 🪪 Step 6: Define Tokens

// export const AUTHORIZATION_SERVICE = Symbol("AuthorizationService");

// # ⚙️ Step 7: Register Services (Bootstrap)

// ```ts
// const services = new ServiceCollection();

// services.addSingleton(AUTHORIZATION_SERVICE, () => {
//   return new DefaultAuthorizationService();
// });

// const rootProvider = services.build();
// ```

// # 🔁 Step 8: Scoped Usage (Per Request)

// ```ts
// const scope = rootProvider.createScope();

// const authService = scope.resolve<IAuthorizationService>(
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
//       const authService = provider.resolve<IAuthorizationService>(
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

// | Feature            | Your Implementation |
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
