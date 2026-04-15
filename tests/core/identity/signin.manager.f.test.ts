import { describe, it, expect, beforeEach, vi } from "vitest";
import { SignInManager } from "../../../src/core/identity/signin.manager.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { InvalidOperationException } from "../../../src/types/exception.js";
import { HttpContext, HttpContextAccessor } from "../../../src/http/index.js";
import { IncomingMessage, ServerResponse } from "http";
import {
  IdentityConstants,
  IdentityErrorDescriber,
  IdentityResult,
  SignInResult,
  UserManager
} from "../../../src/core/identity/index.js";
import { IdentityRole, IdentityUser } from "../../../src/core/types/index.js";
import { InMemoryContext } from "../../../src/core/contexts/index.js";
import { DbContextOptions, ModelBuilder, PrimaryKey } from "../../../src/contexts/index.js";
import { InMemoryUserStore } from "../../../src/core/extensions/user-stores/index.js";
import {
  DefaultUserConfirmation,
  LookupNormalizer,
  PasswordHasher,
  UserClaimsPrincipalFactory
} from "../../../src/core/extensions/index.js";
import { PasswordValidator, UserValidator } from "../../../src/core/validators/index.js";
import { IOptions } from "../../../src/types/index.js";
import { AuthenticateResult, AuthenticationOptions, AuthenticationProperties, AuthenticationSchemeProvider, AuthenticationTicket } from "../../../src/http/authentication/index.js";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../../src/claims/index.js";

// Dummy user
class TestUser extends IdentityUser<string> {
  constructor() {
    super();
    this.id = "u1";
    this.userName = "rejwanul";
    this.passwordHash = null;
    this.securityStamp = "stamp";
  }
}

class TestRole extends IdentityRole<string> {
  constructor(id?: string, name?: string) {
    super(name);
    this.id = id ?? "";
  }
}

class FakeContext extends InMemoryContext<TestUser, TestRole, string> {
  constructor(options?: DbContextOptions) {
    super(options as DbContextOptions);
  }
  protected override onModelCreating(): void {
    super.onModelCreating(new ModelBuilder());
    this.users = this.register(TestUser, new PrimaryKey({ id: "string" }, { auto: false }));
    this.roles = this.register(TestRole, new PrimaryKey({ id: "string" }, { auto: false }));
  }
}

class FakeStore extends InMemoryUserStore<string, TestUser, TestRole, InMemoryContext<TestUser, TestRole, string>> {
  constructor(options: DbContextOptions) {
    super(FakeContext, TestUser, TestRole, options);
  }
}

class DummyClaimsFactory extends UserClaimsPrincipalFactory<string, TestUser, TestRole> {
  constructor(userManager: UserManager<string, TestUser>, options: IOptions<IdentityOptions>) {
    super(userManager, options);
  }
}

class DummySchemeProvider extends AuthenticationSchemeProvider {
  constructor(options: IOptions<AuthenticationOptions>) {
    super(options);
  }
}

class DummyConfirmation extends DefaultUserConfirmation<string, TestUser> {}

class DummyHttpContextAccessor extends HttpContextAccessor {
  constructor(ctx?: HttpContext) {
    super();
    this.httpContext = ctx ?? new HttpContext({} as IncomingMessage, {} as ServerResponse);
  }
}

class FakeSchemes {
  async getSchemeAsync(name: string) {
    if (name === IdentityConstants.TwoFactorRememberMeScheme) return {};
    if (name === IdentityConstants.ExternalScheme) return {};
    if (name === IdentityConstants.TwoFactorUserIdScheme) return {};
    return null;
  }
}

class FakeTwoFactorInfo { constructor(public user: TestUser, public loginProvider: string | null = null) {} }

describe("SignInManager extended external/two-factor functions", () => {
  // let manager: any;
  // let user: TestUser;

  // beforeEach(() => {
  //   user = new TestUser();
  //   manager = {
  //     userManager: {
  //       findByLoginAsync: vi.fn(),
  //       findByIdAsync: vi.fn().mockResolvedValue(user),
  //       getUserIdAsync: vi.fn().mockResolvedValue("u1"),
  //       getSecurityStampAsync: vi.fn().mockResolvedValue("stamp"),
  //       supportsUserSecurityStamp: true,
  //       supportsUserTwoFactor: true,
  //       getTwoFactorEnabledAsync: vi.fn().mockResolvedValue(true),
  //       getValidTwoFactorProvidersAsync: vi.fn().mockResolvedValue(["provider"]),
  //       supportsUserLockout: true,
  //       isLockedOutAsync: vi.fn().mockResolvedValue(false),
  //       resetAccessFailedCountAsync: vi.fn().mockResolvedValue(IdentityResult.success()),
  //       setAuthenticationTokenAsync: vi.fn().mockResolvedValue(IdentityResult.success())
  //     },
  //     schemes: {
  //       getAllSchemesAsync: vi.fn().mockResolvedValue([
  //         { name: "google", displayName: "Google" },
  //         { name: "x", displayName: "" }
  //       ]),
  //       getSchemeAsync: vi.fn().mockResolvedValue({})
  //     },
  //     context: {
  //       authenticateAsync: vi.fn().mockResolvedValue({
  //         principal: new ClaimsPrincipal([
  //           new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "provKey")], IdentityConstants.ExternalScheme)
  //         ]),
  //         properties: {
  //           items: new Map([["LoginProviderKey", "google"], ["XsrfKey", "u1"]]),
  //           getTokens: () => [{ name: "t1", value: "v1" }]
  //         }
  //       }),
  //       signInAsync: vi.fn(),
  //       signOutAsync: vi.fn()
  //     },
  //     options: { claimsIdentity: { securityStampClaimType: "stamp" } },
  //     signInOrTwoFactorAsync: vi.fn().mockResolvedValue(SignInResult.success),
  //     canSignInAsync: vi.fn().mockResolvedValue(true),
  //     twoFactorInfo: null
  //   };
  // });
  let manager: SignInManager<string, TestUser>;
  let userManager: UserManager<string, TestUser>;
  let claimsFactory: DummyClaimsFactory;
  let store: FakeStore;
  let user: TestUser;

  const optionsAccessor = { value: new IdentityOptions() };
  const hasher = new PasswordHasher<TestUser>();
  const errorDescriber = new IdentityErrorDescriber();
  const optionsAuthentication = { value: new AuthenticationOptions() };
  const schemes = new DummySchemeProvider(optionsAuthentication);
  const confirmation = new DummyConfirmation();

  let contextAccessor: DummyHttpContextAccessor;

  beforeEach(() => {
    store = new FakeStore(new DbContextOptions(optionsAccessor.value));
    userManager = new UserManager(
      store,
      optionsAccessor,
      hasher,
      [new UserValidator(errorDescriber)],
      [new PasswordValidator(errorDescriber)],
      new LookupNormalizer(),
      errorDescriber
    );
    user = new TestUser();
    claimsFactory = new DummyClaimsFactory(userManager, optionsAccessor);
    contextAccessor = new DummyHttpContextAccessor();
    manager = new SignInManager(
      userManager,
      claimsFactory,
      contextAccessor,
      optionsAccessor,
      schemes,
      confirmation
    );
    // manager.context.authenticateAsync = (scheme: string): Promise<any> => {
    //   // Minimal stub: always return a principal with Name claim "u1"
    //   const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "u1")], scheme);
    //   const principal = new ClaimsPrincipal([identity]);
    //   return Promise.resolve({ principal, properties: { isPersistent: true } });
    // }
    (manager as any).schemes.getSchemeAsync = async (name: string) => {
      if (name === IdentityConstants.TwoFactorRememberMeScheme) return Promise.resolve({} as any);
      return Promise.resolve(null);
    };

    manager.userManager.getUserIdAsync = async () => "u1";

    manager.context.authenticateAsync = async (scheme: string) => {
      if (scheme === IdentityConstants.TwoFactorRememberMeScheme) {
        const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "u1")], scheme);
        return Promise.resolve({ principal: new ClaimsPrincipal([identity]), properties: { isPersistent: true } });
      }
      return Promise.resolve({ principal: null } as any);
    };

    manager.context.signInAsync = async (scheme, principal, props) => {
      manager.context.signedIn = { scheme, principal, props };
    };

    manager.userManager.redeemTwoFactorRecoveryCodeAsync = async (u, code) => {
      if (code === "goodcode")
        return IdentityResult.success()
      return IdentityResult.failed([])
    }

    manager.userManager.verifyTwoFactorTokenAsync = async (u, provider, code) =>
      (code === "123456");

    (manager as any).retrieveTwoFactorInfoAsync = async () => new FakeTwoFactorInfo(user, "provider");

  });


  // it("externalLoginSignInAsync overload without bypassTwoFactor delegates to core", async () => {
  //   manager.userManager.findByLoginAsync.mockResolvedValue(user);
  //   manager.preSignInCheck = vi.fn().mockResolvedValue(null);
  //   const result = await manager.externalLoginSignInAsync("google", "provKey", true);
  //   expect(result).toBe(SignInResult.success);
  // });

  // it("externalLoginSignInCoreAsync returns failed when user not found", async () => {
  //   manager.userManager.findByLoginAsync.mockResolvedValue(null);
  //   const result = await manager["externalLoginSignInCoreAsync"]("google", "provKey", true, false);
  //   expect(result).toBe(SignInResult.failed);
  // });

  // it("getExternalAuthenticationSchemesAsync filters only schemes with displayName", async () => {
  //   const schemes = await manager.getExternalAuthenticationSchemesAsync();
  //   expect(schemes).toEqual([{ name: "google", displayName: "Google" }]);
  // });

  it("getExternalLoginInfoAsync returns null when xsrf mismatch", async () => {
    const info = await manager.getExternalLoginInfoAsync("wrong");
    expect(info).toBeNull();
  });

  // it("getExternalLoginInfoAsync returns valid info", async () => {
  //   const info = await manager.getExternalLoginInfoAsync("u1");
  //   expect(info!.loginProvider).toBe("google");
  //   expect(info!.providerKey).toBe("provKey");
  // });

  // it("updateExternalAuthenticationTokensAsync returns failed when user not found", async () => {
  //   const extLogin = { loginProvider: "google", providerKey: "provKey", authenticationTokens: [{ name: "t1", value: "v1" }] };
  //   manager.userManager.findByLoginAsync.mockResolvedValue(null);
  //   const result = await manager.updateExternalAuthenticationTokensAsync(extLogin);
  //   expect(result.succeeded).toBe(false);
  // });

  // it("updateExternalAuthenticationTokensAsync returns success when tokens set", async () => {
  //   const extLogin = { loginProvider: "google", providerKey: "provKey", authenticationTokens: [{ name: "t1", value: "v1" }] };
  //   manager.userManager.findByLoginAsync.mockResolvedValue(user);
  //   const result = await manager.updateExternalAuthenticationTokensAsync(extLogin);
  //   expect(result).toEqual(IdentityResult.success());
  // });

  // it("configureExternalAuthenticationProperties sets provider and xsrf", () => {
  //   const props = manager.configureExternalAuthenticationProperties("google", "/redir", "u1");
  //   expect((props.items as any).get("LoginProviderKey")).toBe("google");
  //   expect((props.items as any).get("XsrfKey")).toBe("u1");
  // });

  // it("storeTwoFactorInfo returns principal with claims", () => {
  //   const principal = (manager as any).storeTwoFactorInfo("u1", "google");
  //   expect(principal.findFirstValue(ClaimTypes.name)).toBe("u1");
  //   expect(principal.findFirstValue(ClaimTypes.AuthenticationMethod)).toBe("google");
  // });

  // it("storeRememberClient returns principal with stamp", async () => {
  //   const principal = await manager.storeRememberClient(user);
  //   expect(principal.findFirstValue("stamp")).toBe("stamp");
  // });

  // it("isTwoFactorEnabledAsync returns true when enabled and providers exist", async () => {
  //   const result = await manager.isTwoFactorEnabledAsync(user);
  //   expect(result).toBe(true);
  // });

  it("signInOrTwoFactorAsync returns twoFactorRequired when enabled and not remembered", async () => {
    manager.isTwoFactorEnabledAsync = vi.fn().mockResolvedValue(true);
    manager.isTwoFactorClientRememberedAsync = vi.fn().mockResolvedValue(false);
    const result = await (manager as any).signInOrTwoFactorAsync(user, true, "google", false);
    expect(result).toBe(SignInResult.twoFactorRequired);
  });

  // it("retrieveTwoFactorInfoAsync returns null when no principal", async () => {
  //   manager.context.authenticateAsync.mockResolvedValue({ principal: null });
  //   const result = await manager["retrieveTwoFactorInfoAsync"]();
  //   expect(result).toBeNull();
  // });

  // it("isLockedOut returns true when supports and locked", async () => {
  //   manager.userManager.isLockedOutAsync.mockResolvedValue(true);
  //   const result = await (manager as any).isLockedOut(user);
  //   expect(result).toBe(true);
  // });

  it("lockedOut returns lockedOut result", async () => {
    const result = await (manager as any).lockedOut(user);
    expect(result).toBe(SignInResult.lockedOut);
  });

  // it("preSignInCheck returns notAllowed when cannot sign in", async () => {
  //   manager.canSignInAsync.mockResolvedValue(false);
  //   const result = await (manager as any).preSignInCheck(user);
  //   expect(result).toBe(SignInResult.notAllowed);
  // });

  it("resetLockoutWithResult returns success when supportsUserLockout", async () => {
    const result = await manager["resetLockoutWithResult"](user);
    expect(result).toEqual(IdentityResult.success());
  });

  // it("resetLockoutWithResult returns identityResult when resetLockout throws IdentityResultException", async () => {
  //   const fakeResult = IdentityResult.failed([]);
  //   (manager as any).resetLockout = vi.fn().mockRejectedValue({ identityResult: fakeResult, instanceof: Object });
  //   const result = await manager["resetLockoutWithResult"](user);
  //   expect(result).toEqual(fakeResult);
  // });
});
