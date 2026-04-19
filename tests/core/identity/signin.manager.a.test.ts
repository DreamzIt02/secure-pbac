import { describe, it, expect, beforeEach } from "vitest";
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
import { AuthenticationOptions, AuthenticationSchemeProvider } from "../../../src/http/authentication/index.js";

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

  it("constructor throws if userManager is null", () => {
    expect(() => new SignInManager(
      null as any,
      claimsFactory,
      contextAccessor,
      optionsAccessor,
      schemes,
      confirmation
    )).toThrowError();
  });

  it("constructor throws if contextAccessor is null", () => {
    expect(() => new SignInManager(
      userManager,
      claimsFactory,
      null as any,
      optionsAccessor,
      schemes,
      confirmation
    )).toThrow();
  });

  it("constructor throws if claimsFactory is null", () => {
    expect(() => new SignInManager(
      userManager,
      null as any,
      contextAccessor,
      optionsAccessor,
      schemes,
      confirmation
    )).toThrow();
  });

  it("options are set from accessor", () => {
    expect(manager.options).toBeInstanceOf(IdentityOptions);
  });

  it("authenticationScheme defaults to ApplicationScheme", () => {
    expect(manager.authenticationScheme).toBe("Identity.Application");
  });

  it("context getter returns from accessor when _context not set", () => {
    expect(manager.context).toBeInstanceOf(HttpContext);
  });

  it("context setter overrides accessor context", () => {
    const newCtx = new HttpContext({} as IncomingMessage, {} as ServerResponse);
    manager.context = newCtx;
    expect(manager.context).toBe(newCtx);
  });

  it("context getter throws if no context available", () => {
    // Create an accessor with no httpContext
    const badAccessor = { httpContext: null } as any;

    const badManager = new SignInManager(
      userManager,
      claimsFactory,
      badAccessor,
      optionsAccessor,
      schemes,
      confirmation
    );

    expect(() => badManager.context).toThrow(InvalidOperationException);
  });


});
