import { describe, it, expect, beforeEach } from "vitest";
import { IdentityRole, IdentityUser } from "../../../../src/core/types/index.js";
import { InMemoryContext } from "../../../../src/core/contexts/index.js";
import { DbContextOptions } from "../../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../../src/core/extensions/user-stores/index.js";

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

// Dummy context subclass
class TestContext extends InMemoryContext<TestUser, TestRole, string> {
  constructor(options: DbContextOptions) {
    super(options);
  }
}

describe("InMemoryUserStore", () => {
  let options: DbContextOptions;

  beforeEach(() => {
    options = new DbContextOptions();
  });

  it("initializes static context on first construction", () => {
    const store = new InMemoryUserStore<string, TestUser, TestRole, TestContext>(
      TestContext,
      TestUser,
      TestRole,
      options
    );
    expect(store.getContext).toBeInstanceOf(TestContext);
  });

  it("reuses static context on subsequent constructions", () => {
    const store1 = new InMemoryUserStore<string, TestUser, TestRole, TestContext>(
      TestContext,
      TestUser,
      TestRole,
      options
    );
    const store2 = new InMemoryUserStore<string, TestUser, TestRole, TestContext>(
      TestContext,
      TestUser,
      TestRole,
      options
    );
    expect(store1.getContext).toBe(store2.getContext);
  });

  it("dispose resets static context", () => {
    const store = new InMemoryUserStore<string, TestUser, TestRole, TestContext>(
      TestContext,
      TestUser,
      TestRole,
      options
    );
    store.dispose();
    expect(store.getContext).toBeNull();
  });
});
