import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { DefaultUserPasswordStore } from "../../../../src/core/extensions/user-stores/index.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

describe("DefaultUserPasswordStore", () => {
  const store = new DefaultUserPasswordStore<string, TestUser>();
  const user = new TestUser("1", "Alice");
  const cancellationToken = new CancellationToken();

  it("setPasswordHashAsync should throw", () => {
    expect(() => store.setPasswordHashAsync(user, "hash", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getPasswordHashAsync should throw", () => {
    expect(() => store.getPasswordHashAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("hasPasswordAsync should throw", () => {
    expect(() => store.hasPasswordAsync(user, cancellationToken))
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
