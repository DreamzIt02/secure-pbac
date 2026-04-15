import { describe, it, expect, beforeEach } from "vitest";
import { Book, DbContext1, User } from "../../src/contexts/db.context.js";
import { CancellationToken } from "../../src/types/cancellation.js";

describe("DbContext1", () => {
  let ctx: DbContext1;

  beforeEach(() => {
    ctx = new DbContext1();
  });

  it("registers Users and Books sets", () => {
    const users = ctx.set(User);
    const books = ctx.set(Book);
    expect(users).toBeDefined();
    expect(books).toBeDefined();
  });

  it("throws when accessing unregistered entity", () => {
    class NotRegistered {}
    expect(() => ctx.set(NotRegistered)).toThrow(Error);
  });

  it("adds and retrieves a User", () => {
    const u = new User();
    u.text = "hello";
    ctx.add(u);
    const arr = ctx.set(User).toArray();
    expect(arr.length).toBe(1);
    expect(arr[0].text).toBe("hello");
    expect(typeof arr[0].id).toBe("string"); // auto UUID
  });

  it("updates a User", () => {
    const u = new User();
    u.text = "old";
    ctx.add(u);
    u.text = "new";
    ctx.update(u);
    const arr = ctx.set(User).toArray();
    expect(arr[0].text).toBe("new");
  });

  it("attaches a Book", () => {
    const b = new Book();
    b.title = "Book1";
    ctx.attach(b);
    const arr = ctx.set(Book).toArray();
    expect(arr[0].title).toBe("Book1");
    expect(typeof arr[0].isbn).toBe("string"); // auto UUID
  });

  it("removes a User", () => {
    const u = new User();
    ctx.add(u);
    ctx.remove(u);
    const arr = ctx.set(User).toArray();
    expect(arr.length).toBe(0);
  });

  it("saveChangesAsync respects cancellation", async () => {
    const token = new CancellationToken();
    token.cancel();
    await expect(ctx.saveChangesAsync(token))
      .rejects.toThrow(/Cancellation requested/i);
  });

  it("saveChangesAsync completes when not cancelled", async () => {
    const token = new CancellationToken();
    await expect(ctx.saveChangesAsync(token)).resolves.toBeUndefined();
  });
});
