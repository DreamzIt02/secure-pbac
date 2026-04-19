import { describe, it, expect, beforeEach } from "vitest";
import { IdentityErrorDescriber, IdentityResult, UserManager } from "../../../src/core/identity/index.js";
import { UserValidator, EmailAddressAttribute, IUserValidator, IPasswordValidator } from "../../../src/core/validators/index.js";
import { IdentityUser, PasswordVerificationResult } from "../../../src/core/types/index.js";
import { CancellationToken } from "../../../src/types/cancellation.js";
import { ILookupNormalizer, IPasswordHasher, IUserStore } from "../../../src/core/extensions/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { IOptions } from "../../../src/types/index.js";

// Example TestUser extending IdentityUser
class TestUser extends IdentityUser<string> {
  constructor(id: string, userName: string, email: string) {
    super(userName);
    this.id = id;
    this.email = email;
  }
}

// ✅ Fixed fakeStore
const fakeStore: IUserStore<TestUser> = {
  async getUserIdAsync(user: TestUser, cancellationToken: CancellationToken): Promise<string> {
    cancellationToken.throwIfCancellationRequested();
    return user.id as string;
  },

  async getUserNameAsync(user: TestUser, cancellationToken: CancellationToken): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    return user.userName;
  },

  async setUserNameAsync(user: TestUser, userName: string | null, cancellationToken: CancellationToken): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    user.userName = userName;
  },

  async createAsync(user: TestUser, cancellationToken: CancellationToken) {
    cancellationToken.throwIfCancellationRequested();
    return IdentityResult.success();
  },

  async updateAsync(user: TestUser, cancellationToken: CancellationToken) {
    cancellationToken.throwIfCancellationRequested();
    return IdentityResult.success();
  },

  async deleteAsync(user: TestUser, cancellationToken: CancellationToken) {
    cancellationToken.throwIfCancellationRequested();
    return IdentityResult.success();
  },

  async findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TestUser | null> {
    cancellationToken.throwIfCancellationRequested();
    return null;
  },

  async findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TestUser | null> {
    cancellationToken.throwIfCancellationRequested();
    return null;
  },

  [Symbol.dispose]() {
    // TODO: Dispose
  },

};


// ✅ Fixed fakeHasher
const fakeHasher: IPasswordHasher<TestUser> = {
  hashPassword(user: TestUser, password: string): string {
    // simple stub: return a constant string
    return "hashed";
  },

  verifyHashedPassword(user: TestUser, hashedPassword: string, providedPassword: string): PasswordVerificationResult {
    // simple stub: always succeed
    return PasswordVerificationResult.Success;
  }
};

// ✅ Fake validator that always succeeds
const fakeUserValidators: IUserValidator<string, TestUser>[] = [
  {
    async validateAsync(manager, user): Promise<IdentityResult> {
      // simple stub: always return success
      return IdentityResult.success();
    }
  }
];
// ✅ Fake password validator that always succeeds
const fakePasswordValidators: IPasswordValidator<string, TestUser>[] = [
  {
    async validateAsync(manager, user, password: string | null): Promise<IdentityResult> {
      // simple stub: always return success
      return IdentityResult.success();
    }
  }
];


// ✅ Fixed fakeNormalizer
const fakeNormalizer: ILookupNormalizer = {
  normalizeName(name: string | null): string | null {
    return name ? name.toUpperCase() : null;
  },
  normalizeEmail(email: string | null): string | null {
    return email ? email.toUpperCase() : null;
  }
};

const fakeErrors = new IdentityErrorDescriber();

describe("UserValidator", () => {
  // ✅ Construct with all arguments
  let manager: UserManager<string, TestUser>;

  // ✅ fresh manager for each test
  beforeEach(() => {
    const fakeOptions: IOptions<IdentityOptions> = { value: new IdentityOptions() };
    manager = new UserManager<string, TestUser>(
      fakeStore as any,
      fakeHasher,
      fakeUserValidators,
      fakePasswordValidators,
      fakeNormalizer,
      fakeErrors,
      fakeOptions,
    );
  });

  it("returns success for valid user without unique email requirement", async () => {
    manager.getUserNameAsync = async (u) => u.userName ?? "";
    manager.getUserIdAsync = async (u) => u.id;
    manager.findByNameAsync = async () => null;

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("1", "validUser", "e@mail.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(true);
  });

  it("fails for empty username", async () => {
    manager.getUserNameAsync = async () => "";
    manager.getUserIdAsync = async (u) => u.id;

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("1", "", "e@mail.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidUserName");
  });

  it("fails for invalid characters in username", async () => {
    manager.options.user.allowedUserNameCharacters = "abc";
    manager.getUserNameAsync = async () => "xyz";
    manager.getUserIdAsync = async (u) => u.id;

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("1", "xyz", "e@mail.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidUserName");
  });

  it("fails for duplicate username", async () => {
    manager.getUserNameAsync = async (u) =>{
      return u.userName ?? ""
    };
    manager.getUserIdAsync = async (u) => u.id;
    manager.findByNameAsync = async () => new TestUser("1", "dupUser", "e@mail.com");

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("2", "dupUser", "e@mail.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("DuplicateUserName");
  });

  it("fails for empty email when unique email required", async () => {
    manager.options.user.requireUniqueEmail = true;
    manager.getUserNameAsync = async (u) => u.userName ?? "user";
    manager.getUserIdAsync = async (u) => u.id;
    manager.getEmailAsync = async () => "";

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("1", "user", "");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidEmail");
  });

  it("fails for invalid email format", async () => {
    manager.options.user.requireUniqueEmail = true;
    manager.getUserNameAsync = async (u) => u.userName ?? "user";
    manager.getUserIdAsync = async (u) => u.id;
    manager.getEmailAsync = async () => "not-an-email";

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("1", "user", "not-an-email");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("InvalidEmail");
    expect(EmailAddressAttribute.isValid("not-an-email")).toBe(false);
  });

  it("fails for duplicate email", async () => {
    manager.options.user.requireUniqueEmail = true;
    manager.getUserNameAsync = async (u) => u.userName ?? "user";
    manager.getUserIdAsync = async (u) => u.id;
    manager.getEmailAsync = async (u) => u.email ?? "";
    manager.findByEmailAsync = async () => new TestUser("1", "other", "dup@example.com");

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("2", "user", "dup@example.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("DuplicateEmail");
  });

  it("returns success for valid email", async () => {
    manager.options.user.requireUniqueEmail = true;
    manager.getUserNameAsync = async (u) => u.userName ?? "user";
    manager.getUserIdAsync = async (u) => u.id;
    manager.getEmailAsync = async (u) => u.email ?? "";
    manager.findByEmailAsync = async () => null;

    const validator = new UserValidator<string,TestUser>();
    const user = new TestUser("2", "user", "valid@example.com");
    const result = await validator.validateAsync(manager, user);
    expect(result.succeeded).toBe(true);
  });
});
