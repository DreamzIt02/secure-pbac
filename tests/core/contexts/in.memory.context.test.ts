import { describe, it, expect } from "vitest";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbConnection, DbContextOptions } from "../../../src/contexts/index.js";

// Dummy user/role classes
class TestUser extends IdentityUser<string> {}
class TestRole extends IdentityRole<string> {}

class TestContext extends InMemoryContext<TestUser, TestRole, string> {
    public constructor(arg1?: DbConnection | DbContextOptions, arg2?: DbContextOptions) {
        super(arg1 as any, arg2);
    }
}

describe("InMemoryContext", () => {
  it("constructs with DbConnection", () => {
    const connection = new DbConnection();
    const ctx = InMemoryContext.create<TestUser, TestRole, string>(connection);
    expect(ctx).toBeInstanceOf(InMemoryContext);
  });

  it("constructs with DbContext", () => {
    const options = new DbContextOptions();
    const ctx = InMemoryContext.create<TestUser, TestRole, string>(TestContext, options);
    expect(ctx).toBeInstanceOf(InMemoryContext);
  });

  it("create with DbConnection returns InMemoryContext", () => {
    const connection = new DbConnection();
    const options = new DbContextOptions();
    const ctx = InMemoryContext.create<TestUser, TestRole, string>(connection, options);
    expect(ctx).toBeInstanceOf(InMemoryContext);
  });

  it("create with DbContext subclass returns that context", () => {
    class CustomContext extends InMemoryContext<TestUser, TestRole, string> {}
    const options = new DbContextOptions();
    const ctx = InMemoryContext.create(CustomContext, options);
    expect(ctx).toBeInstanceOf(CustomContext);
  });

  it("constructs with DbContextOptions: TestContext", () => {
    const options = new DbContextOptions();
    const ctx = new TestContext(options);
    expect(ctx).toBeInstanceOf(TestContext);
  });

  it("initialize calls ensureCreated", () => {
    class CustomContext extends InMemoryContext<TestUser, TestRole, string> {
      public constructor(arg1?: DbConnection | DbContextOptions, arg2?: DbContextOptions) {
        super(arg1 as any, arg2);
      }
      public ensureCreatedCalled = false;
      public override ensureCreated(): boolean {
        this.ensureCreatedCalled = true;
        return true;
      }
    }
    const ctx = new CustomContext();
    const initialized = InMemoryContext.initialize(ctx);
    expect(initialized.ensureCreatedCalled).toBe(true);
  });
});
