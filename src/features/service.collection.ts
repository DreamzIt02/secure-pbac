import { getInjectableToken, Token } from "../decorators/index.js";
import { Factory, ParamDescriptor, ServiceDescriptor, ServiceLifetime, ServiceProvider } from "./service.provider.js";

// # 🏗️ Step 7: Service Collection (Builder like .NET)
export class ServiceCollection {
  private readonly descriptors: ServiceDescriptor[] = [];

  addSingleton<T>(token: Token<T>, impl: new () => T, deps?: ParamDescriptor) {
    // this.checkMultiAllowed(token, multi);
    //
    token = getInjectableToken(token);

    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Singleton,
      implementation: impl,
      deps: deps,
    });
  }

  addScoped<T>(token: Token<T>, impl: new () => T, deps?: ParamDescriptor) {
    // this.checkMultiAllowed(token, multi);
    //
    token = getInjectableToken(token);

    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Scoped,
      implementation: impl,
      deps: deps,
    });
  }

  addTransient<T>(token: Token<T>, impl: new () => T, deps?: ParamDescriptor) {
    // this.checkMultiAllowed(token, multi);
    //
    token = getInjectableToken(token);

    this.descriptors.push({
      token,
      lifetime: ServiceLifetime.Transient,
      implementation: impl,
      deps: deps,
    });
  }

  addFactory<T>(token: Token<T>, factory: Factory<T>, lifetime: ServiceLifetime) {
    // this.checkMultiAllowed(token, multi);
    //
    token = getInjectableToken(token);

    this.descriptors.push({ token: token, factory: factory, lifetime: lifetime });
  }

  /**
   * Merge and Unified service collection
   * @param other 
   * @returns 
   */
  // merge(other: ServiceCollection): ServiceCollection {
  //   this.descriptors.push(...other.descriptors);
  //   other = this;
  //   return this;
  // }

  build(): ServiceProvider {
    return new ServiceProvider(this.descriptors);
  }
  /**
   * 1. **Conditional multi registration**:
   * When we register a service for a token, we must decide whether that token supports multiple registrations. 
   * If the first registration says `multi: true`, then subsequent registrations for the same token are allowed. 
   * If the first registration says `multi: false` (default), then subsequent registrations should overwrite the previous one (like .NET’s `GetService<T>()` behavior).
   * 
   * 2. **Resolution semantics**: 
   * - `getService<T>(token)` → return the **last registered** instance (like `.NET GetService<T>()`).
   * - `getServices<T>(token)` → return **all registered instances** (like `.NET GetServices<T>()`). 
   * @param token 
   * @param multi 
   */
  // private checkMultiAllowed<T>(token: Token<T>, multi?: boolean): ServiceDescriptor | undefined {
  //   const existing = this.descriptors.filter(d => d.token === token);
  //   if (existing.length > 0) {
  //     const first = existing[0];
  //     if (!first.multi && multi) {
  //       throw new Error(`Token ${token.toString()} was first registered as single, cannot add multi.`);
  //     }
  //     if (first.multi && !multi) {
  //       throw new Error(`Token ${token.toString()} was first registered as multi, must continue as multi.`);
  //     }
  //     //
  //     return first;
  //   }
  //   return undefined;
  // }
}
