import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../../src/core/types/index.js";
import { DefaultUserEmailStore } from "../../../../src/core/extensions/user-stores/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

describe("DefaultUserEmailStore", () => {
  const store = new DefaultUserEmailStore<string, TestUser>();
  const user = new TestUser("1", "Alice");
  const cancellationToken = new CancellationToken();

  it("setEmailAsync should throw", () => {
    expect(() => store.setEmailAsync(user, "alice@example.com", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getEmailAsync should throw", () => {
    expect(() => store.getEmailAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getEmailConfirmedAsync should throw", () => {
    expect(() => store.getEmailConfirmedAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("setEmailConfirmedAsync should throw", () => {
    expect(() => store.setEmailConfirmedAsync(user, true, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("findByEmailAsync should throw", () => {
    expect(() => store.findByEmailAsync("alice@example.com", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getNormalizedEmailAsync should throw", () => {
    expect(() => store.getNormalizedEmailAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("setNormalizedEmailAsync should throw", () => {
    expect(() => store.setNormalizedEmailAsync(user, "ALICE@EXAMPLE.COM", cancellationToken))
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
