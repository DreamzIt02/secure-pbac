import { AsyncLocalStorage } from "async_hooks";
import { IdentityRole, IdentityUser } from "../../types/index.js";
import { UserStore } from "./user.store.impl.js";
import { AllowedPrimaryKeysSafe } from "../../../contexts/index.js";
import { IdentityDbContext } from "../../contexts/index.js";

/**
 * Node.js AsyncLocalStorage-based implementation of TUserStore<TUser>.
 * This keeps a user store bound to the current async execution context,
 * similar to how ASP.NET Core uses AsyncLocal<T>.
 */
export class AsyncLocalUserStore<
  TKey  extends AllowedPrimaryKeysSafe,
  TUser extends IdentityUser<any> = IdentityUser<TKey>,
  TRole extends IdentityRole<any> = IdentityRole<TKey>,
  TContext extends IdentityDbContext<TUser, TRole, TKey> = IdentityDbContext<TUser, TRole, TKey>,
> extends UserStore<TUser, TRole, TKey, TContext> {

  private static storage = new AsyncLocalStorage<IdentityDbContext<any, any, any>>();

  constructor(contextCtor: new () => TContext, userCtor: new () => TUser, roleCtor: new () => TRole) {
    const context = AsyncLocalUserStore.getContext(contextCtor);
    super(context as TContext, userCtor, roleCtor);
  }

  [Symbol.dispose](): void {
    AsyncLocalUserStore.storage.disable();
  }

  public static runWithContext<T, TContext extends IdentityDbContext<any, any, any>>(
    fn: () => Promise<T>,
    contextCtor: new () => TContext = IdentityDbContext as any
  ): Promise<T> {
    const context = new contextCtor();
    return AsyncLocalUserStore.storage.run(context, fn);
  }

  public static getContext<TContext extends IdentityDbContext<any, any, any>>(
    contextCtor: new () => TContext = IdentityDbContext as any
  ): TContext {
    let ctx = AsyncLocalUserStore.storage.getStore();
    if (!ctx) {
      // If no context is bound, create one using the ctor
      ctx = new contextCtor();
      AsyncLocalUserStore.storage.enterWith(ctx);
    }
    return ctx as TContext;
  }

  dispose(): void {
    AsyncLocalUserStore.storage.disable();
  }
}


// await AsyncLocalUserStore.runWithContext(async () => {
//   const store = new AsyncLocalUserStore(AppUser, IdentityRole);
//   const manager = new UserManager1<AppUser>(store, new PasswordHasher());
// });
