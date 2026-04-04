// tests/default-user-store.test.ts
import { describe, it, expect } from "vitest";
import { DefaultUserStore } from "../../../src/core/identity/index.js";
import { IUser } from "../../../src/core/identity/types.js";

describe("DefaultUserStore", () => {
  interface TestUser extends IUser {
    id: string;
    userName: string;
    email?: string;
  }

  const store = new DefaultUserStore<TestUser>();
  const user: TestUser = { id: "1", userName: "alice", email: "alice@example.com" };

  it("should create and find a user by id", async () => {
    await store.create(user);
    const found = await store.findById("1");
    expect(found).not.toBeNull();
    expect(found?.userName).toBe("alice");
  });

  it("should update an existing user", async () => {
    user.userName = "alice_updated";
    await store.update(user);
    const found = await store.findById("1");
    expect(found?.userName).toBe("alice_updated");
  });

  it("should throw error when updating non-existent user", async () => {
    const fakeUser: TestUser = { id: "999", userName: "ghost" };
    await expect(store.update(fakeUser)).rejects.toThrow("User with id 999 not found");
  });

  it("should delete a user", async () => {
    await store.delete(user);
    const found = await store.findById("1");
    expect(found).toBeNull();
  });

  it("should find user by name", async () => {
    const bob: TestUser = { id: "2", userName: "bob" };
    await store.create(bob);
    const found = await store.findByName("bob");
    expect(found?.id).toBe("2");
  });

  it("should set and get user name", async () => {
    const charlie: TestUser = { id: "3", userName: "charlie" };
    await store.create(charlie);
    await store.setUserName(charlie, "charlie_new");
    const name = await store.getUserName(charlie);
    expect(name).toBe("charlie_new");
  });

  it("should get user id", async () => {
    const id = await store.getUserId(user);
    expect(id).toBe("1");
  });

  it("should set and get email", async () => {
    const dave: TestUser = { id: "4", userName: "dave" };
    await store.create(dave);
    await store.setEmail(dave, "dave@example.com");
    const email = await store.getEmail(dave);
    expect(email).toBe("dave@example.com");
  });

  it("should return null when email not set", async () => {
    const eve: TestUser = { id: "5", userName: "eve" };
    await store.create(eve);
    const email = await store.getEmail(eve);
    expect(email).toBeNull();
  });
});
