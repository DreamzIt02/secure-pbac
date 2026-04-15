import { describe, it, expect } from "vitest";
import { IdentityUser, UserLoginInfo } from "../../../../src/core/types/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { DefaultUserLoginStore } from "../../../../src/core/extensions/user-stores/index.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

const loginInfo = new UserLoginInfo("github", "abc123", "GitHub");

describe("DefaultUserLoginStore", () => {
  const store = new DefaultUserLoginStore<TestUser>();
  const user = new TestUser("1", "Alice");
  const cancellationToken = new CancellationToken();

  it("addLoginAsync should throw", () => {
    expect(() => store.addLoginAsync(user, loginInfo, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("removeLoginAsync should throw", () => {
    expect(() => store.removeLoginAsync(user, "github", "abc123", cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("getLoginsAsync should throw", () => {
    expect(() => store.getLoginsAsync(user, cancellationToken))
      .toThrow("Method not implemented.");
  });

  it("findByLoginAsync should throw", () => {
    expect(() => store.findByLoginAsync("github", "abc123", cancellationToken))
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
