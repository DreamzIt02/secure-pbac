import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { DefaultUserRoleStore } from "../../../../src/core/extensions/user-stores/index.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

describe("DefaultUserRoleStore", () => {
  const store = new DefaultUserRoleStore<TestUser>();
  const user = new TestUser("1", "Alice");
  const cancellationToken = new CancellationToken();

  it("addToRoleAsync should throw", () => {
    expect(() => store.addToRoleAsync(user, "Admin", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("removeFromRoleAsync should throw", () => {
    expect(() => store.removeFromRoleAsync(user, "Admin", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getRolesAsync should throw", () => {
    expect(() => store.getRolesAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("isInRoleAsync should throw", () => {
    expect(() => store.isInRoleAsync(user, "Admin", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getUsersInRoleAsync should throw", () => {
    expect(() => store.getUsersInRoleAsync("Admin", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getUserIdAsync should throw", () => {
    expect(() => store.getUserIdAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getUserNameAsync should throw", () => {
    expect(() => store.getUserNameAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("setUserNameAsync should throw", () => {
    expect(() => store.setUserNameAsync(user, "Bob", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("createAsync should throw", () => {
    expect(() => store.createAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("updateAsync should throw", () => {
    expect(() => store.updateAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("deleteAsync should throw", () => {
    expect(() => store.deleteAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("findByIdAsync should throw", () => {
    expect(() => store.findByIdAsync("1", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("findByNameAsync should throw", () => {
    expect(() => store.findByNameAsync("Alice", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("[Symbol.dispose] should throw", () => {
    expect(() => store[Symbol.dispose]())
      .toThrow("Method not implemented.");
  });
});
