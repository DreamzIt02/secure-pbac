// # 🧪 `signin.manager.spec.ts`

import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdentityUser } from "../../../src/core/types/index.js";
import { IdentityConstants, SignInManager, SignInResult } from "../../../src/core/identity/index.js";
import { ClaimsIdentity, ClaimsPrincipal } from "../../../src/claims/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";

// ---- Mock User ----
class TestUser extends IdentityUser<string> {
  constructor(id: string) {
    super();
    this.id = id;
  }
}

// ---- Shared mocks ----
let userManager: any;
let context: any;
let contextAccessor: any;
let schemes: any;
let claimsFactory: any;
let confirmation: any;

let manager: SignInManager<string, TestUser>;

beforeEach(() => {
  userManager = {
    findByNameAsync: vi.fn(),
    checkPasswordAsync: vi.fn(),
    getUserId: vi.fn(),
    getUserIdAsync: vi.fn(),
    isEmailConfirmedAsync: vi.fn().mockResolvedValue(true),
    isPhoneNumberConfirmedAsync: vi.fn().mockResolvedValue(true),
    supportsUserLockout: true,
    accessFailedAsync: vi.fn(),
    isLockedOutAsync: vi.fn().mockResolvedValue(false),
    resetAccessFailedCountAsync: vi.fn(),
    supportsUserTwoFactor: true,
    getTwoFactorEnabledAsync: vi.fn().mockResolvedValue(false),
    getValidTwoFactorProvidersAsync: vi.fn().mockResolvedValue([]),
    supportsUserSecurityStamp: true,
    getSecurityStampAsync: vi.fn().mockResolvedValue("stamp"),
    getUserAsync: vi.fn(),
    findByIdAsync: vi.fn(),
    verifyTwoFactorTokenAsync: vi.fn(),
    findByLoginAsync: vi.fn(),
  };

  context = {
    user: null,
    authenticateAsync: vi.fn(),
    signInAsync: vi.fn(),
    signOutAsync: vi.fn(),
  };

  contextAccessor = {
    httpContext: context,
  };

  schemes = {
    getSchemeAsync: vi.fn(),
    getAllSchemesAsync: vi.fn().mockResolvedValue([]),
  };

  claimsFactory = {
    createAsync: vi.fn().mockResolvedValue(
      new ClaimsPrincipal(new ClaimsIdentity([], IdentityConstants.ApplicationScheme))
    ),
  };

  confirmation = {
    isConfirmedAsync: vi.fn().mockResolvedValue(true),
  };

  manager = new SignInManager(
    userManager,
    claimsFactory,
    contextAccessor,
    { value: new IdentityOptions() },
    schemes,
    confirmation
  );
});

// # 🔐 Core Sign-In Tests

it("should sign in user (boolean overload)", async () => {
  const user = new TestUser("1");

  await manager.signInAsync(user, true);

  expect(context.signInAsync).toHaveBeenCalled();
});

it("should sign in user with authentication method", async () => {
  const user = new TestUser("1");

  await manager.signInAsync(user, true, "pwd");

  expect(context.signInAsync).toHaveBeenCalled();
});

// # 🔁 Refresh Sign-In

it("should refresh sign in successfully", async () => {
  const user = new TestUser("1");

  context.authenticateAsync.mockResolvedValue({
    succeeded: true,
    principal: {
      identity: { isAuthenticated: true },
      findFirst: vi.fn(),
    },
    properties: {},
  });

  userManager.getUserId.mockReturnValue("1");
  userManager.getUserIdAsync.mockResolvedValue("1");

  await manager.refreshSignInAsync(user);

  expect(context.signInAsync).toHaveBeenCalled();
});

it("should fail refresh if not authenticated", async () => {
  context.authenticateAsync.mockResolvedValue({ succeeded: false });

  const result = await (manager as any).refreshSignInCoreAsync(new TestUser("1"));

  expect(result.success).toBe(false);
});

// # 🔑 Password Sign-In

it("should sign in with valid password", async () => {
  const user = new TestUser("1");

  userManager.checkPasswordAsync.mockResolvedValue(true);
  userManager.resetAccessFailedCountAsync.mockResolvedValue({ succeeded: true });

  const result = await manager.passwordSignInAsync(user, "pass", true, false);

  expect(result).toBe(SignInResult.success);
});

it("should fail with wrong password", async () => {
  const user = new TestUser("1");

  userManager.checkPasswordAsync.mockResolvedValue(false);

  const result = await manager.passwordSignInAsync(user, "wrong", true, false);

  expect(result).toBe(SignInResult.failed);
});

// # 🔒 Lockout Branch

it("should lock user after failed attempts", async () => {
  const user = new TestUser("1");

  userManager.checkPasswordAsync.mockResolvedValue(false);
  userManager.accessFailedAsync.mockResolvedValue({ succeeded: true });
  userManager.isLockedOutAsync.mockResolvedValue(true);

  const result = await manager.passwordSignInAsync(user, "wrong", true, true);

  expect(result).toBe(SignInResult.lockedOut);
});

// # 🔐 Two Factor Tests

it("should require 2FA when enabled", async () => {
  const user = new TestUser("1");

  userManager.getTwoFactorEnabledAsync.mockResolvedValue(true);
  userManager.getValidTwoFactorProvidersAsync.mockResolvedValue(["app"]);

  const result = await (manager as any).signInOrTwoFactorAsync(user, true);

  expect(result).toBe(SignInResult.twoFactorRequired);
});

it("should complete 2FA successfully", async () => {
  const user = new TestUser("1");

  (manager as any).twoFactorInfo = { user };

  userManager.verifyTwoFactorTokenAsync.mockResolvedValue(true);
  userManager.resetAccessFailedCountAsync.mockResolvedValue({ succeeded: true });

  const result = await manager.twoFactorAuthenticatorSignInAsync("123456", true, false);

  expect(result).toBe(SignInResult.success);
});

// # 🔏 Security Stamp

it("should validate security stamp", async () => {
  const user = new TestUser("1");

  userManager.getSecurityStampAsync.mockResolvedValue("stamp");

  const result = await manager.validateSecurityStampAsync(user, "stamp");

  expect(result).toBe(true);
});

it("should fail security stamp", async () => {
  const user = new TestUser("1");

  userManager.getSecurityStampAsync.mockResolvedValue("stamp");

  const result = await manager.validateSecurityStampAsync(user, "wrong");

  expect(result).toBe(false);
});

// # 🌐 External Login

it("should sign in with external login", async () => {
  const user = new TestUser("1");

  userManager.findByLoginAsync.mockResolvedValue(user);

  const result = await manager.externalLoginSignInAsync("google", "key", true);

  expect(result).toBe(SignInResult.success);
});

it("should fail external login if user not found", async () => {
  userManager.findByLoginAsync.mockResolvedValue(null);

  const result = await manager.externalLoginSignInAsync("google", "key", true);

  expect(result).toBe(SignInResult.failed);
});

// # 🚪 Sign Out

it("should sign out user", async () => {
  schemes.getSchemeAsync.mockResolvedValue(true);

  await manager.signOutAsync();

  expect(context.signOutAsync).toHaveBeenCalled();
});
