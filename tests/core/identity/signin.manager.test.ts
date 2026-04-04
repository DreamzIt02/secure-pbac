// tests/sign-in-manager.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { SignInManager } from "../../../src/core/identity/index.js";
import { UserManager, Claim } from "../../../src/core/identity/index.js";
import { IUser } from "../../../src/core/identity/types.js";

describe("SignInManager", () => {
  interface TestUser extends IUser {
    id: string;
    userName: string;
    email?: string;
    passwordHash?: string;
    claims?: Claim[];
    roles?: string[];
    accessFailedCount?: number;
    lockoutEnd?: Date | null;
    lockoutEnabled?: boolean;
    twoFactorEnabled?: boolean;
    securityStamp?: string;
    isSignedIn?: boolean;
    recoveryCodes?: string[];
    logins?: { loginProvider: string; providerKey: string }[];
  }

  let manager: UserManager<TestUser>;
  let signInManager: SignInManager<TestUser>;
  let user: TestUser;

  beforeEach(async () => {
    manager = new UserManager<TestUser>();
    signInManager = new SignInManager<TestUser>(manager);
    user = { id: "1", userName: "alice" };
    await manager.createAsync(user, "secret");
  });

  // -----------------------------
  // Basic sign-in/out
  // -----------------------------
  it("should sign in and out user", async () => {
    const result = await signInManager.signInAsync(user);
    expect(result.succeeded).toBe(true);
    expect(await signInManager.isSignedInAsync(user)).toBe(true);

    await signInManager.signOutAsync(user);
    expect(await signInManager.isSignedInAsync(user)).toBe(false);
  });

  it("should fail sign in if locked out", async () => {
    await manager.setLockoutEnabledAsync(user, true);
    await manager.setLockoutEndDateAsync(user, new Date(Date.now() + 1000 * 60));
    const result = await signInManager.signInAsync(user);
    expect(result.succeeded).toBe(false);
  });

  // -----------------------------
  // Password sign-in
  // -----------------------------
  it("should sign in with correct password", async () => {
    const result = await signInManager.passwordSignInAsync(user, "secret");
    expect(result.succeeded).toBe(true);
    expect(await signInManager.isSignedInAsync(user)).toBe(true);
  });

  it("should fail sign in with wrong password", async () => {
    const result = await signInManager.passwordSignInAsync(user, "wrong");
    expect(result.succeeded).toBe(false);
  });

  // -----------------------------
  // Recovery code sign-in
  // -----------------------------
  it("should sign in with valid recovery code", async () => {
    const codes = await manager.generateRecoveryCodesAsync(user, 1);
    const result = await signInManager.recoveryCodeSignInAsync(user, codes[0]);
    expect(result.succeeded).toBe(true);
  });

  it("should fail sign in with invalid recovery code", async () => {
    const result = await signInManager.recoveryCodeSignInAsync(user, "invalid");
    expect(result.succeeded).toBe(false);
  });

  // -----------------------------
  // External login sign-in
  // -----------------------------
  it("should sign in with valid external login", async () => {
    await manager.addLoginAsync(user, "Google", "google-key");
    const result = await signInManager.externalLoginSignInAsync(user, "Google", "google-key");
    expect(result.succeeded).toBe(true);
  });

  it("should fail sign in with invalid external login", async () => {
    const result = await signInManager.externalLoginSignInAsync(user, "Facebook", "fb-key");
    expect(result.succeeded).toBe(false);
  });

  // -----------------------------
  // Refresh sign-in
  // -----------------------------
  it("should refresh sign-in", async () => {
    await signInManager.refreshSignInAsync(user);
    expect(await signInManager.isSignedInAsync(user)).toBe(true);
  });

  // -----------------------------
  // Delegation methods
  // -----------------------------
  it("should delegate canSignInAsync", async () => {
    const canSignIn = await signInManager.canSignInAsync(user);
    expect(canSignIn).toBe(true);
  });

  it("should delegate isLockedOutAsync", async () => {
    await manager.setLockoutEnabledAsync(user, true);
    await manager.setLockoutEndDateAsync(user, new Date(Date.now() + 1000 * 60));
    const lockedOut = await signInManager.isLockedOutAsync(user);
    expect(lockedOut).toBe(true);
  });
});
