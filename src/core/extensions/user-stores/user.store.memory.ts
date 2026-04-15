import { AllowedPrimaryKeysSafe, DbContextOptions } from "../../../contexts/index.js";
import { InMemoryContext } from "../../contexts/index.js";
import { IdentityRole, IdentityUser } from "../../types/index.js";
import { UserStore } from "./user.store.impl.js";

export class InMemoryUserStore<
  TKey  extends AllowedPrimaryKeysSafe,
  TUser extends IdentityUser<any> = IdentityUser<TKey>,
  TRole extends IdentityRole<any> = IdentityRole<TKey>,
  TContext extends InMemoryContext<TUser, TRole, TKey> = InMemoryContext<TUser, TRole, TKey>,
> extends UserStore<TUser, TRole, TKey, TContext> {

  private static context: InMemoryContext<any, any, any>;
  // = InMemoryContext.create<any, any, any>(new DbConnection(), new DbContextOptions());

  constructor(contextCtor: new (options: DbContextOptions) => TContext, userCtor: new () => TUser, roleCtor: new () => TRole, options: DbContextOptions) {
    if (!(InMemoryUserStore.context instanceof contextCtor)) {
      InMemoryUserStore.context = InMemoryContext.create<TUser, TRole, TKey>(contextCtor, options);
    }
    super(InMemoryUserStore.context as TContext, userCtor, roleCtor);
  }

  public get getContext() {
    return InMemoryUserStore.context;
  }

  dispose(): void {
    super.dispose();
    InMemoryUserStore.context = null as any;
  }
}

// ### How It Differs from `AsyncLocalUserStore`
// - **AsyncLocalUserStore**: Each async call chain (e.g. each HTTP request) gets its own `InMemoryContext` via `AsyncLocalStorage.run()`. Perfect for multi‑request server apps.
// - **InMemoryUserStore**: All operations share a single `InMemoryContext` instance stored in memory. Perfect for unit tests, prototypes, or single‑user scenarios.


// ```ts
// const store = new InMemoryUserStore();
// const user = new IdentityUser();
// user.userName = "bob";

// await store.createAsync(user);
// const found = await store.findByNameAsync("BOB");
// console.log(found);
// ```
