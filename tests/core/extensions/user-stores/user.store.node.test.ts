import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../../src/core/types/index.js";
import { IdentityDbContext } from "../../../../src/core/contexts/index.js";
import { AsyncLocalUserStore } from "../../../../src/core/extensions/user-stores/index.js";

// Dummy user and role
class TestUser extends IdentityUser<string> {
  constructor() {
    super();
    this.id = "u1";
    this.userName = "rejwanul";
  }
}
class TestRole extends IdentityRole<string> {
  constructor() {
    super();
    this.id = "r1";
    this.name = "admin";
  }
}

// Dummy context
class TestContext extends IdentityDbContext<TestUser, TestRole, string> {
  constructor() { super(); }
}

describe("AsyncLocalUserStore", () => {
  beforeEach(() => {
    // Reset AsyncLocalStorage between tests
    AsyncLocalUserStore["storage"].disable();
  });

  it("constructor initializes context via getContext", () => {
    const store = new AsyncLocalUserStore<string, TestUser, TestRole, TestContext>(
      TestContext,
      TestUser,
      TestRole
    );
    expect(store).toBeInstanceOf(AsyncLocalUserStore);
  });

  it("getContext creates new context if none exists", () => {
    const ctx = AsyncLocalUserStore.getContext(TestContext);
    expect(ctx).toBeInstanceOf(TestContext);
  });

  it("getContext reuses existing context", () => {
    const ctx1 = AsyncLocalUserStore.getContext(TestContext);
    const ctx2 = AsyncLocalUserStore.getContext(TestContext);
    expect(ctx1).toBe(ctx2);
  });

  it("runWithContext runs function with bound context", async () => {
    const result = await AsyncLocalUserStore.runWithContext(async () => {
      const ctx = AsyncLocalUserStore.getContext(TestContext);
      return ctx instanceof TestContext;
    }, TestContext);
    expect(result).toBe(true);
  });

  it("dispose disables storage and resets context", () => {
    const store = new AsyncLocalUserStore<string, TestUser, TestRole, TestContext>(
        TestContext,
        TestUser,
        TestRole
    );
    const ctx1 = AsyncLocalUserStore.getContext(TestContext);
    store.dispose();
    const ctx2 = AsyncLocalUserStore.getContext(TestContext);
    // After dispose, a new context is created
    expect(ctx2).not.toBe(ctx1);
    expect(ctx2).toBeInstanceOf(TestContext);
  });

  it("[Symbol.dispose] disables storage and resets context", () => {
    const store = new AsyncLocalUserStore<string, TestUser, TestRole, TestContext>(
        TestContext,
        TestUser,
        TestRole
    );
    const ctx1 = AsyncLocalUserStore.getContext(TestContext);
    store[Symbol.dispose]();
    const ctx2 = AsyncLocalUserStore.getContext(TestContext);
    expect(ctx2).not.toBe(ctx1);
    expect(ctx2).toBeInstanceOf(TestContext);
  });

});
