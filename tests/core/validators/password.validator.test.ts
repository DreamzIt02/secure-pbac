import { describe, it, expect, beforeEach } from "vitest";
import { IPasswordValidator, PasswordValidator } from "../../../src/core/validators/index.js";
import { IdentityErrorDescriber, IdentityResult, IUserManager, UserManager } from "../../../src/core/identity/index.js";
import { IdentityUser, PasswordVerificationResult } from "../../../src/core/types/index.js";
import { IdentityOptions } from "../../../src/core/options/index.js";
import { CancellationToken } from "../../../src/types/cancellation.js";
import { ILookupNormalizer, IPasswordHasher, IUserStore } from "../../../src/core/extensions/index.js";
import { IUserValidator } from "../../../src/core/validators/index.js";
import { IOptions } from "../../../src/types/index.js";

// Example TestUser extending IdentityUser
class TestUser extends IdentityUser<string> {
  constructor(userName: string, email: string) {
    super(userName);
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

describe("PasswordValidator", () => {
  let validator: PasswordValidator<string, TestUser>;
  // ✅ Construct with all arguments
  let manager: UserManager<string, TestUser>;
  let user: TestUser;

  beforeEach(() => {
    const fakeOptions: IOptions<IdentityOptions> = { value: new IdentityOptions() };
    validator = new PasswordValidator<string, TestUser>(new IdentityErrorDescriber());
    manager = new UserManager<string, TestUser>(
        fakeStore as any,
        fakeOptions,
        fakeHasher,
        fakeUserValidators,
        fakePasswordValidators,
        fakeNormalizer,
        fakeErrors
    );
    user = new TestUser("user", "user@example.com");
    // default options
    manager.options.password.requiredLength = 6;
    manager.options.password.requireNonAlphanumeric = true;
    manager.options.password.requireDigit = true;
    manager.options.password.requireLowercase = true;
    manager.options.password.requireUppercase = true;
    manager.options.password.requiredUniqueChars = 1;
  });

  it("returns success for valid password", async () => {
    const result = await validator.validateAsync(manager, user, "Valid1!");
    expect(result.succeeded).toBe(true);
  });

  it("fails for too short password", async () => {
    const result = await validator.validateAsync(manager, user, "Ab1!");
    expect(result.succeeded).toBe(false);
    expect(result.errors[0].code).toBe("PasswordTooShort");
  });

  it("fails when missing non-alphanumeric", async () => {
    const result = await validator.validateAsync(manager, user, "Valid12");
    expect(result.succeeded).toBe(false);
    expect(result.errors.some(e => e.code === "PasswordRequiresNonAlphanumeric")).toBe(true);
  });

  it("fails when missing digit", async () => {
    const result = await validator.validateAsync(manager, user, "Valid!");
    expect(result.succeeded).toBe(false);
    expect(result.errors.some(e => e.code === "PasswordRequiresDigit")).toBe(true);
  });

  it("fails when missing lowercase", async () => {
    const result = await validator.validateAsync(manager, user, "VALID1!");
    expect(result.succeeded).toBe(false);
    expect(result.errors.some(e => e.code === "PasswordRequiresLower")).toBe(true);
  });

  it("fails when missing uppercase", async () => {
    const result = await validator.validateAsync(manager, user, "valid1!");
    expect(result.succeeded).toBe(false);
    expect(result.errors.some(e => e.code === "PasswordRequiresUpper")).toBe(true);
  });

  it("fails when not enough unique characters", async () => {
    manager.options.password.requiredUniqueChars = 5;
    const result = await validator.validateAsync(manager, user, "aaaaaa1!");
    expect(result.succeeded).toBe(false);
    expect(result.errors.some(e => e.code === "PasswordRequiresUniqueChars")).toBe(true);
  });

  it("throws if manager is null", async () => {
    await expect(validator.validateAsync(null as any, user, "Valid1!")).rejects.toThrow();
  });
});
