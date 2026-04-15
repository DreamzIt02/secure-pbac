import { describe, it, expect } from "vitest";
import { DefaultAuthenticatorKeyStore } from "../../../../src/core/extensions/user-stores/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";

interface TestUser {
  id: string;
  name: string;
}

describe("DefaultAuthenticatorKeyStore", () => {
  const store = new DefaultAuthenticatorKeyStore<TestUser>();
  const user: TestUser = { id: "1", name: "Alice" };
  const cancellationToken = new CancellationToken();

  it("setAuthenticatorKeyAsync should throw", () => {
    expect(() =>
      store.setAuthenticatorKeyAsync(user, "key", cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("getAuthenticatorKeyAsync should throw", () => {
    expect(() =>
      store.getAuthenticatorKeyAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("getUserIdAsync should throw", () => {
    expect(() =>
      store.getUserIdAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("getUserNameAsync should throw", () => {
    expect(() =>
      store.getUserNameAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("setUserNameAsync should throw", () => {
    expect(() =>
      store.setUserNameAsync(user, "Bob", cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("createAsync should throw", () => {
    expect(() =>
      store.createAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("updateAsync should throw", () => {
    expect(() =>
      store.updateAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("deleteAsync should throw", () => {
    expect(() =>
      store.deleteAsync(user, cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("findByIdAsync should throw", () => {
    expect(() =>
      store.findByIdAsync("1", cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("findByNameAsync should throw", () => {
    expect(() =>
      store.findByNameAsync("Alice", cancellationToken)
    ).toThrow("Method not implemented.");
  });

  it("[Symbol.dispose] should throw", () => {
    expect(() => store[Symbol.dispose]()).toThrow("Method not implemented.");
  });
});
