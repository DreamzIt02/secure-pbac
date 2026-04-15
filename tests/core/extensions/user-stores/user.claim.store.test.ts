import { describe, it, expect } from "vitest";
import { IdentityUser } from "../../../../src/core/types/index.js";
import { DefaultUserClaimStore } from "../../../../src/core/extensions/user-stores/index.js";
import { CancellationToken } from "../../../../src/types/cancellation.js";
import { Claim } from "../../../../src/claims/index.js";

class TestUser extends IdentityUser<string> {
    constructor(userName?: string);
    constructor(userName: string, id?: string);
    constructor(userName: string, id?: string) {
        super(userName);
        if (id)
            this.id = id ?? null;
    }
}

describe("DefaultUserClaimStore", () => {
  const store = new DefaultUserClaimStore<TestUser>();
  const user = new TestUser("1", "Alice");
  const claim = new Claim("role", "admin");
  const cancellationToken = new CancellationToken();

  it("getClaimsAsync should throw", () => {
    expect(() => store.getClaimsAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("addClaimsAsync should throw", () => {
    expect(() => store.addClaimsAsync(user, [claim], cancellationToken)).toThrow("Method not implemented.");
  });

  it("replaceClaimAsync should throw", () => {
    expect(() => store.replaceClaimAsync(user, claim, claim, cancellationToken)).toThrow("Method not implemented.");
  });

  it("removeClaimsAsync should throw", () => {
    expect(() => store.removeClaimsAsync(user, [claim], cancellationToken)).toThrow("Method not implemented.");
  });

  it("getUsersForClaimAsync should throw", () => {
    expect(() => store.getUsersForClaimAsync(claim, cancellationToken)).toThrow("Method not implemented.");
  });

  it("getUserIdAsync should throw", () => {
    expect(() => store.getUserIdAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("getUserNameAsync should throw", () => {
    expect(() => store.getUserNameAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("setUserNameAsync should throw", () => {
    expect(() => store.setUserNameAsync(user, "Bob", cancellationToken)).toThrow("Method not implemented.");
  });

  it("createAsync should throw", () => {
    expect(() => store.createAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("updateAsync should throw", () => {
    expect(() => store.updateAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("deleteAsync should throw", () => {
    expect(() => store.deleteAsync(user, cancellationToken)).toThrow("Method not implemented.");
  });

  it("findByIdAsync should throw", () => {
    expect(() => store.findByIdAsync("1", cancellationToken)).toThrow("Method not implemented.");
  });

  it("findByNameAsync should throw", () => {
    expect(() => store.findByNameAsync("Alice", cancellationToken)).toThrow("Method not implemented.");
  });

  it("[Symbol.dispose] should throw", () => {
    expect(() => store[Symbol.dispose]()).toThrow("Method not implemented.");
  });
});
