import { describe, it, expect } from "vitest";
import { DefaultUserConfirmation } from "../../../src/core/extensions/user.confirmation.js";
import { IdentityUser } from "../../../src/core/types/index.js";

// Dummy user type
// Simple test user and role
class TestUser extends IdentityUser<string> {
  constructor();
  constructor(id: string, userName: string, email?: string | null);
  constructor(id: string, userName?: string, email?: string | null, emailConfirmed?: boolean);
  constructor(id?: string, userName?: string, email?: string | null, emailConfirmed?: boolean) {
    super(userName ?? "");
    this.id = id ?? "";
    this.userName = userName ?? "";
    this.email = email ?? null;
    this.emailConfirmed = emailConfirmed ?? false;
  }
}

// Fake UserManager implementing isEmailConfirmedAsync
class FakeUserManager {
  constructor(private shouldConfirm: boolean) {}
  async isEmailConfirmedAsync(user: TestUser): Promise<boolean> {
    // simulate checking user's emailConfirmed property
    return this.shouldConfirm && user.emailConfirmed;
  }
}

describe("DefaultUserConfirmation", () => {
  it("returns true when user is confirmed", async () => {
    const user = new TestUser("u1", "u1", "u1@mail.me", true);
    const manager = new FakeUserManager(true);
    const confirmation = new DefaultUserConfirmation<string, TestUser>();

    const result = await confirmation.isConfirmedAsync(manager as any, user);
    expect(result).toBe(true);
  });

  it("returns false when user is not confirmed", async () => {
    const user = new TestUser("u2", "u2", "u2@mail.me", false);
    const manager = new FakeUserManager(true);
    const confirmation = new DefaultUserConfirmation<string, TestUser>();

    const result = await confirmation.isConfirmedAsync(manager as any, user);
    expect(result).toBe(false);
  });

  it("returns false when manager denies confirmation", async () => {
    const user = new TestUser("u3", "u3", "u3@mail.me", true);
    const manager = new FakeUserManager(false);
    const confirmation = new DefaultUserConfirmation<string, TestUser>();

    const result = await confirmation.isConfirmedAsync(manager as any, user);
    expect(result).toBe(false);
  });
});
