import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { DefaultUserPhoneNumberStore } from "../../../../src/core/extensions/user-stores/index.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

describe("DefaultUserPhoneNumberStore", () => {
  const store = new DefaultUserPhoneNumberStore<TestUser>();
  const user = new TestUser("1", "Alice");
  const cancellationToken = new CancellationToken();

  it("setPhoneNumberAsync should throw", () => {
    expect(() => store.setPhoneNumberAsync(user, "1234567890", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getPhoneNumberAsync should throw", () => {
    expect(() => store.getPhoneNumberAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getPhoneNumberConfirmedAsync should throw", () => {
    expect(() => store.getPhoneNumberConfirmedAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("setPhoneNumberConfirmedAsync should throw", () => {
    expect(() => store.setPhoneNumberConfirmedAsync(user, true, cancellationToken))
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
