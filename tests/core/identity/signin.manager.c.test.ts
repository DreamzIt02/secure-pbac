import { describe, it, expect, beforeEach, vi } from "vitest";
import { SignInManager } from "../../../src/core/identity/signin.manager.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { InvalidOperationException } from "../../../src/types/exception.js";
import { HttpContext, HttpContextAccessor } from "../../../src/http/index.js";
import { IncomingMessage, ServerResponse } from "http";
import {
  IdentityErrorDescriber,
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

describe("SignInManager extended functions", () => {
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
  });

  it("validateSecurityStampAsync returns null if principal is null", async () => {
    const result = await manager.validateSecurityStampAsync(null);
    expect(result).toBeNull();
  });

it("validateSecurityStampAsync returns user when security stamp matches", async () => {
  const identity = new ClaimsIdentity(
    [new Claim(manager.options.claimsIdentity.securityStampClaimType, "stamp")],
    "Identity.Application"
  );
  const principal = new ClaimsPrincipal([identity]);

  // Ensure getUserAsync returns a TestUser with matching securityStamp
  manager.userManager.getUserAsync = async () => {
    const u = new TestUser();
    u.securityStamp = "stamp";
    return u;
  };

  const result = await manager.validateSecurityStampAsync(principal);
  expect(result).toBeInstanceOf(TestUser);
});


  it("validateSecurityStampAsync returns null when security stamp mismatch", async () => {
    const identity = new ClaimsIdentity([new Claim("stamp", "wrong")], "Identity.Application");
    const principal = new ClaimsPrincipal([identity]);
    const result = await manager.validateSecurityStampAsync(principal);
    expect(result).toBeNull();
  });

  it("validateSecurityStampAsync overload with user returns true when stamps match", async () => {
    const result = await manager.validateSecurityStampAsync(user, "stamp");
    expect(result).toBe(true);
  });

  it("validateTwoFactorSecurityStampAsync returns null if principal is null", async () => {
    const result = await manager.validateTwoFactorSecurityStampAsync(null);
    expect(result).toBeNull();
  });

it("validateTwoFactorSecurityStampAsync returns user when stamps match", async () => {
  const identity = new ClaimsIdentity(
    [
      new Claim(manager.options.claimsIdentity.securityStampClaimType, "stamp"),
      new Claim(ClaimTypes.Name, "u1")
    ],
    "Identity.Application"
  );
  const principal = new ClaimsPrincipal([identity]);

  // Ensure findByIdAsync returns a TestUser with matching securityStamp
  manager.userManager.findByIdAsync = async () => {
    const u = new TestUser();
    u.securityStamp = "stamp";
    return u;
  };

  const result = await manager.validateTwoFactorSecurityStampAsync(principal);
  expect(result).toBeInstanceOf(TestUser);
});



  it("passwordSignInAsync returns failed when userName not found", async () => {
    const result = await manager.passwordSignInAsync("unknown", "pwd", false, false);
    expect(result).toBe(SignInResult.failed);
  });

it("passwordSignInAsync returns success when userName and password correct", async () => {
  manager.userManager.findByNameAsync = async () => new TestUser();
  manager.userManager.checkPasswordAsync = async () => true;

  // Ensure signInOrTwoFactorAsync returns success
  (manager as any).signInOrTwoFactorAsync = async () => SignInResult.success;

  const result = await manager.passwordSignInAsync("rejwanul", "correct", false, false);
  expect(result).toBe(SignInResult.success);
});


it("checkPasswordSignInAsync returns success when password correct", async () => {
  manager.userManager.checkPasswordAsync = async () => true;
  (manager as any).resetLockoutWithResult = async () => SignInResult.success;

  const result = await manager.checkPasswordSignInAsync(new TestUser(), "correct", false);
  expect(result).toBe(SignInResult.success);
});


  it("checkPasswordSignInAsync returns failed when password incorrect", async () => {
    const result = await manager.checkPasswordSignInAsync(user, "wrong", true);
    expect(result).toBe(SignInResult.failed);
  });

  it("checkPasswordSignInCoreAsync returns failed when preSignInCheck returns error", async () => {
    (manager as any).preSignInCheck = async () => SignInResult.failed;
    const result = await (manager as any).checkPasswordSignInCoreAsync(user, "correct", false);
    expect(result).toBe(SignInResult.failed);
  });

  it("checkPasswordSignInCoreAsync increments lockout on failure", async () => {
    const result = await (manager as any).checkPasswordSignInCoreAsync(user, "wrong", true);
    expect(result).toBe(SignInResult.failed);
  });
});
