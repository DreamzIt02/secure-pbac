import { describe, it, expect, beforeEach, vi } from "vitest";
import { SignInManager } from "../../../src/core/identity/signin.manager.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { InvalidOperationException } from "../../../src/types/exception.js";
import { HttpContext, HttpContextAccessor } from "../../../src/http/index.js";
import { IncomingMessage, ServerResponse } from "http";
import {
  IdentityErrorDescriber,
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

describe("SignInManager basic behavior", () => {
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
  });

  it("createUserPrincipalAsync returns a ClaimsPrincipal", async () => {
    const principal = await manager.createUserPrincipalAsync(user);
    expect(principal).toBeInstanceOf(ClaimsPrincipal);
  });

  it("isSignedIn returns true when identity matches scheme", async () => {
    const principal = new ClaimsPrincipal([new ClaimsIdentity([], manager.authenticationScheme)]);
    expect(manager.isSignedIn(principal)).toBe(true);
  });

  it("isSignedIn returns false when no matching identity", () => {
    const principal = new ClaimsPrincipal([new ClaimsIdentity([], "OtherScheme")]);
    expect(manager.isSignedIn(principal)).toBe(false);
  });

  it("canSignInAsync returns false if email not confirmed", async () => {
    manager.options.signIn.requireConfirmedEmail = true;
    manager.userManager.isEmailConfirmedAsync = async () => false;
    const result = await manager.canSignInAsync(user);
    expect(result).toBe(false);
  });

  it("canSignInAsync returns false if phone not confirmed", async () => {
    manager.options.signIn.requireConfirmedPhoneNumber = true;
    manager.userManager.isPhoneNumberConfirmedAsync = async () => false;
    const result = await manager.canSignInAsync(user);
    expect(result).toBe(false);
  });

  it("canSignInAsync returns false if account not confirmed", async () => {
    manager.options.signIn.requireConfirmedAccount = true;
    (manager as any).confirmation.isConfirmedAsync = async () => false;
    const result = await manager.canSignInAsync(user);
    expect(result).toBe(false);
  });

  it("canSignInAsync returns true when all confirmed", async () => {
    // Ensure no requirements block sign-in
    manager.options.signIn.requireConfirmedEmail = false;
    manager.options.signIn.requireConfirmedPhoneNumber = false;
    manager.options.signIn.requireConfirmedAccount = false;

    // Ensure mocks return true
    manager.userManager.isEmailConfirmedAsync = async () => true;
    manager.userManager.isPhoneNumberConfirmedAsync = async () => true;
    (manager as any).confirmation.isConfirmedAsync = async () => true;

    const result = await manager.canSignInAsync(user);
    expect(result).toBe(true);
  });


    it("refreshSignInCoreAsync returns false if userId mismatch", async () => {
        const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "other")], "Identity.Application");
        const principal = new ClaimsPrincipal([identity]);

        manager.context.authenticateAsync = async () =>
            AuthenticateResult.success(new AuthenticationTicket(principal, null, ""));

        const result = await (manager as any).refreshSignInCoreAsync(user);
        expect(result.success).toBe(false);
    });

  it("refreshSignInCoreAsync returns false if not authenticated", async () => {
    manager.context.authenticateAsync = async () => AuthenticateResult.fail("Default");
    const result = await (manager as any).refreshSignInCoreAsync(user);
    expect(result.success).toBe(false);
  });

it("refreshSignInCoreAsync returns false if userId mismatch", async () => {
  // Identity with Name claim "other"
  const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "other")], "Identity.Application");
  const principal = new ClaimsPrincipal([identity]);

  manager.context.authenticateAsync = async () =>
    AuthenticateResult.success(new AuthenticationTicket(principal, null, ""));

  const result = await (manager as any).refreshSignInCoreAsync(user);
  expect(result.success).toBe(false);
});

it("refreshSignInCoreAsync returns true when authenticated and ids match", async () => {
  // ✅ authenticationType MUST match manager.authenticationScheme
  const identity = new ClaimsIdentity(
    [new Claim(ClaimTypes.Name, user.id)],
    manager.authenticationScheme
  );

  const principal = new ClaimsPrincipal([identity]);

  manager.context.authenticateAsync = async () =>
    AuthenticateResult.success(
      new AuthenticationTicket(principal, { isPersistent: true } as any, "")
    );

  // ✅ required for ID comparison
  manager.userManager.getUserId = () => user.id;
  manager.userManager.getUserIdAsync = async () => user.id;

  // ✅ required for internal sign-in call
  manager.context.signInAsync = async () => {};

  const result = await (manager as any).refreshSignInCoreAsync(user);

  expect(result.success).toBe(true);
});

  it("signInAsync overload with boolean calls signInWithClaimsAsync", async () => {
    const spy = vi.spyOn(manager, "signInWithClaimsAsync").mockResolvedValue();
    await manager.signInAsync(user, true, "pwd");
    expect(spy).toHaveBeenCalled();
  });

  it("signInAsync overload with AuthenticationProperties calls signInWithClaimsAsync", async () => {
    const spy = vi.spyOn(manager, "signInWithClaimsAsync").mockResolvedValue();
    await manager.signInAsync(user, new AuthenticationProperties(), "pwd");
    expect(spy).toHaveBeenCalled();
  });

    it("signInWithClaimsAsync adds claims and signs in", async () => {
    // Stub signInAsync so it doesn’t throw
    manager.context.signInAsync = async () => {};

    const claim = new Claim(ClaimTypes.AuthenticationMethod, "pwd");
    await manager.signInWithClaimsAsync(user, new AuthenticationProperties(), [claim]);

    expect(manager.context.user).toBeInstanceOf(ClaimsPrincipal);
    expect(manager.context.user.identities[0].claims.some(c => c.type === ClaimTypes.AuthenticationMethod)).toBe(true);
    });


  it("signOutAsync calls context.signOutAsync for application scheme", async () => {
    const spy = vi.spyOn(manager.context, "signOutAsync").mockResolvedValue();
    await manager.signOutAsync();
    expect(spy).toHaveBeenCalledWith(manager.authenticationScheme);
  });
});
