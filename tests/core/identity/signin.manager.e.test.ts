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

describe("SignInManager two-factor functions", () => {
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
      hasher,
      [new UserValidator(errorDescriber)],
      [new PasswordValidator(errorDescriber)],
      new LookupNormalizer(),
      errorDescriber,
      optionsAccessor,
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

  it("isTwoFactorClientRememberedAsync returns false when scheme missing", async () => {
    (manager as any).schemes.getSchemeAsync = async () => null;
    const result = await manager.isTwoFactorClientRememberedAsync(user);
    expect(result).toBe(false);
  });

  // it("isTwoFactorClientRememberedAsync returns true when scheme present and userId matches", async () => {
  //   const result = await manager.isTwoFactorClientRememberedAsync(user);
  //   expect(result).toBe(true);
  // });

  // it("rememberTwoFactorClientAsync signs in with persistent property", async () => {
  //   manager.storeRememberClient = async () => new ClaimsPrincipal([new ClaimsIdentity([], "scheme")]);
  //   await manager.rememberTwoFactorClientAsync(user);
  //   expect(manager.context.signedIn!.props.isPersistent).toBe(true);
  // });

  it("forgetTwoFactorClientAsync signs out of remember scheme", async () => {
    await manager.forgetTwoFactorClientAsync();
    expect(manager.context.signedOut).toBe(IdentityConstants.TwoFactorRememberMeScheme);
  });

  it("twoFactorRecoveryCodeSignInAsync returns failed when info is null", async () => {
    (manager as any).retrieveTwoFactorInfoAsync = async () => null;
    const result = await manager.twoFactorRecoveryCodeSignInAsync("bad");
    expect(result).toBe(SignInResult.failed);
  });

  it("twoFactorRecoveryCodeSignInAsync returns success when code redeemed", async () => {
    const result = await manager.twoFactorRecoveryCodeSignInAsync("goodcode");
    expect(result).toBe(SignInResult.success);
  });

  it("twoFactorAuthenticatorSignInAsync returns failed when info is null", async () => {
    (manager as any).retrieveTwoFactorInfoAsync = async () => null;
    const result = await manager.twoFactorAuthenticatorSignInAsync("123456", false, false);
    expect(result).toBe(SignInResult.failed);
  });

  it("twoFactorAuthenticatorSignInAsync returns success when token verified", async () => {
    const result = await manager.twoFactorAuthenticatorSignInAsync("123456", true, true);
    expect(result).toBe(SignInResult.success);
  });

  it("twoFactorAuthenticatorSignInAsync returns failed when token invalid", async () => {
    const result = await manager.twoFactorAuthenticatorSignInAsync("wrong", false, false);
    expect(result).toBe(SignInResult.failed);
  });

  it("twoFactorSignInAsync returns failed when info is null", async () => {
    (manager as any).retrieveTwoFactorInfoAsync = async () => null;
    const result = await manager.twoFactorSignInAsync("provider", "123456", false, false);
    expect(result).toBe(SignInResult.failed);
  });

  it("twoFactorSignInAsync returns success when token verified", async () => {
    const result = await manager.twoFactorSignInAsync("provider", "123456", true, true);
    expect(result).toBe(SignInResult.success);
  });

  it("twoFactorSignInAsync returns failed when token invalid", async () => {
    const result = await manager.twoFactorSignInAsync("provider", "wrong", false, false);
    expect(result).toBe(SignInResult.failed);
  });

  it("getTwoFactorAuthenticationUserAsync returns null when info is null", async () => {
    (manager as any).retrieveTwoFactorInfoAsync = async () => null;
    const result = await manager.getTwoFactorAuthenticationUserAsync();
    expect(result).toBeNull();
  });

  it("getTwoFactorAuthenticationUserAsync returns user when info present", async () => {
    const result = await manager.getTwoFactorAuthenticationUserAsync();
    expect(result).toBeInstanceOf(TestUser);
  });
});
