import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserManager, User, Claim, IdentityResult, IdentityError, IUserStore, IPasswordHasher } from '../../../src/core/identity/index.js';
import { randomUUID } from '../../../src/core/identity/utils.js';

// Mock implementations
vi.mock('../utils', () => ({
  randomUUID: vi.fn(() => 'mock-uuid-1234'),
}));

// Mock types
type TestUser = User & {
  id?: string;
  email?: string;
  userName?: string;
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  securityStamp?: string;
  lockoutEnabled?: boolean;
  lockoutEnd?: Date | null;
  accessFailedCount?: number;
  roles?: string[];
};

// Mock store
const createMockStore = (): IUserStore<TestUser> => ({
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByName: vi.fn().mockResolvedValue(null),
  getUserName: vi.fn().mockResolvedValue(null),
  setUserName: vi.fn().mockResolvedValue(undefined),
  getUserId: vi.fn().mockResolvedValue('user-id'),
  getEmail: vi.fn(),
  setEmail: vi.fn().mockResolvedValue(undefined),
});

// Mock password hasher
const createMockHasher = (): IPasswordHasher => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn().mockResolvedValue(true),
});

describe('UserManager', () => {
  let userManager: UserManager<TestUser>;
  let mockStore: IUserStore<TestUser>;
  let mockHasher: IPasswordHasher;
  let testUser: TestUser;

  beforeEach(() => {
    mockStore = createMockStore();
    mockHasher = createMockHasher();
    userManager = new UserManager(mockStore, mockHasher);
    
    testUser = {
      email: 'test@example.com',
      userName: 'testuser',
      id: 'user-123',
    };
  });

  // ==================== CORE USER CRUD ====================
  describe('Core User CRUD', () => {
    describe('createAsync', () => {
      it('should create user without password', async () => {
        const result = await userManager.createAsync(testUser);

        expect(result.succeeded).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(mockStore.create).toHaveBeenCalledWith(testUser);
        expect(typeof testUser.id).toBe("string");
        expect(testUser.id).toHaveLength(36); // UUID length
        expect(testUser.id).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });

      it('should create user with password', async () => {
        const result = await userManager.createAsync(testUser, 'password123');

        expect(result.succeeded).toBe(true);
        expect(mockHasher.hash).toHaveBeenCalledWith('password123');
        expect(testUser.passwordHash).toBe('hashed-password');
      });

      it('should handle store creation error', async () => {
        const error = new Error('Store error');
        vi.mocked(mockStore.create).mockRejectedValueOnce(error);

        const result = await userManager.createAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('CreateFailed');
        expect(result.errors[0].description).toBe('Store error');
      });

      it('should handle password hashing error', async () => {
        const error = new Error('Hash error');
        vi.mocked(mockHasher.hash).mockRejectedValueOnce(error);

        const result = await userManager.createAsync(testUser, 'password123');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('CreateFailed');
      });
    });

    describe('updateAsync', () => {
      it('should update user successfully', async () => {
        const result = await userManager.updateAsync(testUser);

        expect(result.succeeded).toBe(true);
        expect(mockStore.update).toHaveBeenCalledWith(testUser);
      });

      it('should handle update error', async () => {
        vi.mocked(mockStore.update).mockRejectedValueOnce(new Error('Update failed'));

        const result = await userManager.updateAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('UpdateFailed');
      });
    });

    describe('deleteAsync', () => {
      it('should delete user successfully', async () => {
        const result = await userManager.deleteAsync(testUser);

        expect(result.succeeded).toBe(true);
        expect(mockStore.delete).toHaveBeenCalledWith(testUser);
      });

      it('should handle delete error', async () => {
        vi.mocked(mockStore.delete).mockRejectedValueOnce(new Error('Delete failed'));

        const result = await userManager.deleteAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('DeleteFailed');
      });
    });

    describe('findByIdAsync', () => {
      it('should find user by id', async () => {
        vi.mocked(mockStore.findById).mockResolvedValueOnce(testUser);

        const result = await userManager.findByIdAsync('user-123');

        expect(result).toEqual(testUser);
        expect(mockStore.findById).toHaveBeenCalledWith('user-123');
      });

      it('should return null if user not found', async () => {
        const result = await userManager.findByIdAsync('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('findByNameAsync', () => {
      it('should find user by name', async () => {
        vi.mocked(mockStore.findByName).mockResolvedValueOnce(testUser);

        const result = await userManager.findByNameAsync('testuser');

        expect(result).toEqual(testUser);
        expect(mockStore.findByName).toHaveBeenCalledWith('testuser');
      });
    });

    describe('getUserNameAsync', () => {
      it('should get user name', async () => {
        vi.mocked(mockStore.getUserName).mockResolvedValueOnce('testuser');

        const result = await userManager.getUserNameAsync(testUser);

        expect(result).toBe('testuser');
      });
    });

    describe('setUserNameAsync', () => {
      it('should set user name successfully', async () => {
        const result = await userManager.setUserNameAsync(testUser, 'newname');

        expect(result.succeeded).toBe(true);
        expect(mockStore.setUserName).toHaveBeenCalledWith(testUser, 'newname');
      });

      it('should handle set user name error', async () => {
        vi.mocked(mockStore.setUserName).mockRejectedValueOnce(new Error('Set failed'));

        const result = await userManager.setUserNameAsync(testUser, 'newname');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('SetUserNameFailed');
      });
    });

    describe('getUserIdAsync', () => {
      it('should get user id', async () => {
        const result = await userManager.getUserIdAsync(testUser);

        expect(result).toBe('user-id');
        expect(mockStore.getUserId).toHaveBeenCalledWith(testUser);
      });
    });
  });

  // ==================== EMAIL MANAGEMENT ====================
  describe('Email Management', () => {
    describe('getEmailAsync', () => {
      it('should get email from store when store has method', async () => {
        vi.mocked(mockStore.getEmail).mockResolvedValueOnce('stored@example.com');

        const result = await userManager.getEmailAsync(testUser);

        expect(result).toBe('stored@example.com');
      });

      it('should fallback to user.email when store has no getEmail', async () => {
        const storeWithoutEmail = { ...mockStore, getEmail: undefined };
        userManager = new UserManager(storeWithoutEmail, mockHasher);
        testUser.email = 'user@example.com';

        const result = await userManager.getEmailAsync(testUser);

        expect(result).toBe('user@example.com');
      });

      it('should return null when no email available', async () => {
        const storeWithoutEmail = { ...mockStore, getEmail: undefined };
        userManager = new UserManager(storeWithoutEmail, mockHasher);
        const userNoEmail = { ...testUser, email: undefined };

        const result = await userManager.getEmailAsync(userNoEmail);

        expect(result).toBeNull();
      });
    });

    describe('setEmailAsync', () => {
      it('should set email successfully', async () => {
        const result = await userManager.setEmailAsync(testUser, 'new@example.com');

        expect(result.succeeded).toBe(true);
        expect(testUser.email).toBe('new@example.com');
        expect(mockStore.setEmail).toHaveBeenCalledWith(testUser, 'new@example.com');
      });

      it('should fail when store does not support email persistence', async () => {
        const storeWithoutEmail = { ...mockStore, setEmail: undefined };
        userManager = new UserManager(storeWithoutEmail, mockHasher);

        const result = await userManager.setEmailAsync(testUser, 'new@example.com');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].description).toContain('not supported');
      });

      it('should handle set email error', async () => {
        vi.mocked(mockStore.setEmail).mockRejectedValueOnce(new Error('Set failed'));

        const result = await userManager.setEmailAsync(testUser, 'new@example.com');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('SetEmailFailed');
      });
    });

    describe('confirmEmailAsync', () => {
      it('should confirm email successfully', async () => {
        testUser.email = 'test@example.com';

        const result = await userManager.confirmEmailAsync(testUser);

        expect(result.succeeded).toBe(true);
      });

      it('should fail when user has no email', async () => {
        testUser.email = undefined;

        const result = await userManager.confirmEmailAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('Invalid');
      });
    });
  });

  // ==================== PASSWORD MANAGEMENT ====================
  describe('Password Management', () => {
    describe('checkPasswordAsync', () => {
      it('should verify correct password', async () => {
        testUser.passwordHash = 'hashed-password';

        const result = await userManager.checkPasswordAsync(testUser, 'password123');

        expect(result).toBe(true);
        expect(mockHasher.verify).toHaveBeenCalledWith('hashed-password', 'password123');
      });

      it('should return false when password is incorrect', async () => {
        testUser.passwordHash = 'hashed-password';
        vi.mocked(mockHasher.verify).mockResolvedValueOnce(false);

        const result = await userManager.checkPasswordAsync(testUser, 'wrongpassword');

        expect(result).toBe(false);
      });

      it('should return false when user has no password', async () => {
        testUser.passwordHash = undefined;

        const result = await userManager.checkPasswordAsync(testUser, 'password123');

        expect(result).toBe(false);
      });
    });

    describe('changePasswordAsync', () => {
      it('should change password successfully', async () => {
        testUser.passwordHash = 'old-hash';

        const result = await userManager.changePasswordAsync(testUser, 'oldpass', 'newpass');

        expect(result.succeeded).toBe(true);
        expect(mockHasher.verify).toHaveBeenCalledWith('old-hash', 'oldpass');
        expect(mockHasher.hash).toHaveBeenCalledWith('newpass');
        expect(mockStore.update).toHaveBeenCalled();
      });

      it('should fail when user has no password set', async () => {
        testUser.passwordHash = undefined;

        const result = await userManager.changePasswordAsync(testUser, 'oldpass', 'newpass');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('NoPassword');
      });

      it('should fail when current password is incorrect', async () => {
        testUser.passwordHash = 'old-hash';
        vi.mocked(mockHasher.verify).mockResolvedValueOnce(false);

        const result = await userManager.changePasswordAsync(testUser, 'wrongpass', 'newpass');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('InvalidPassword');
      });
    });

    describe('resetPasswordAsync', () => {
      it('should reset password successfully', async () => {
        const result = await userManager.resetPasswordAsync(testUser, 'newpass');

        expect(result.succeeded).toBe(true);
        expect(mockHasher.hash).toHaveBeenCalledWith('newpass');
        expect(mockStore.update).toHaveBeenCalled();
      });
    });

    describe('verifyPasswordAsync', () => {
      it('should verify password', async () => {
        testUser.passwordHash = 'hashed-password';

        const result = await userManager.verifyPasswordAsync(testUser, 'password123');

        expect(result).toBe(true);
      });
    });
  });

  // ==================== CLAIMS MANAGEMENT ====================
  describe('Claims Management', () => {
    describe('addClaimAsync', () => {
      it('should add claim to empty claims', async () => {
        const claim = new Claim('role', 'admin');

        const result = await userManager.addClaimAsync(testUser, claim);

        expect(result.succeeded).toBe(true);
        expect(testUser.claims).toContain(claim);
      });

      it('should add claim to existing claims', async () => {
        testUser.claims = [new Claim('role', 'user')];
        const newClaim = new Claim('permission', 'read');

        await userManager.addClaimAsync(testUser, newClaim);

        expect(testUser.claims).toHaveLength(2);
        expect(testUser.claims).toContain(newClaim);
      });
    });

    describe('addClaimsAsync', () => {
      it('should add multiple claims', async () => {
        const claims = [new Claim('role', 'admin'), new Claim('permission', 'write')];

        const result = await userManager.addClaimsAsync(testUser, claims);

        expect(result.succeeded).toBe(true);
        expect(testUser.claims).toHaveLength(2);
      });
    });

    describe('replaceClaimAsync', () => {
      it('should replace existing claim', async () => {
        const oldClaim = new Claim('role', 'user');
        const newClaim = new Claim('role', 'admin');
        testUser.claims = [oldClaim];

        const result = await userManager.replaceClaimAsync(testUser, oldClaim, newClaim);

        expect(result.succeeded).toBe(true);
        expect(testUser.claims[0]).toEqual(newClaim);
      });

      it('should fail when claim not found', async () => {
        testUser.claims = [new Claim('role', 'user')];
        const nonExistentClaim = new Claim('role', 'admin');

        const result = await userManager.replaceClaimAsync(testUser, nonExistentClaim, new Claim('role', 'super'));

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('Invalid');
      });

      it('should fail when user has no claims', async () => {
        const result = await userManager.replaceClaimAsync(testUser, new Claim('role', 'user'), new Claim('role', 'admin'));

        expect(result.succeeded).toBe(false);
      });
    });

    describe('replaceClaimsAsync', () => {
      it('should replace multiple claims', async () => {
        const oldClaims = [new Claim('role', 'user')];
        const newClaims = [new Claim('role', 'admin'), new Claim('permission', 'write')];
        testUser.claims = [...oldClaims, new Claim('permission', 'read')];

        await userManager.replaceClaimsAsync(testUser, oldClaims, newClaims);

        expect(testUser.claims).toHaveLength(3);
        expect(testUser.claims).toContainEqual(new Claim('role', 'admin'));
      });
    });

    describe('removeClaimAsync', () => {
      it('should remove claim successfully', async () => {
        const claim = new Claim('role', 'admin');
        testUser.claims = [claim, new Claim('permission', 'write')];

        const result = await userManager.removeClaimAsync(testUser, claim);

        expect(result.succeeded).toBe(true);
        expect(testUser.claims).toHaveLength(1);
        expect(testUser.claims).not.toContain(claim);
      });

      it('should fail when claim not found', async () => {
        testUser.claims = [new Claim('role', 'user')];

        const result = await userManager.removeClaimAsync(testUser, new Claim('role', 'admin'));

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('NotFound');
      });

      it('should fail when user has no claims', async () => {
        const result = await userManager.removeClaimAsync(testUser, new Claim('role', 'admin'));

        expect(result.succeeded).toBe(false);
      });
    });

    describe('getClaimsAsync', () => {
      it('should get all claims', async () => {
        const claims = [new Claim('role', 'admin'), new Claim('permission', 'write')];
        testUser.claims = claims;

        const result = await userManager.getClaimsAsync(testUser);

        expect(result).toEqual(claims);
      });

      it('should return empty array when user has no claims', async () => {
        const result = await userManager.getClaimsAsync(testUser);

        expect(result).toEqual([]);
      });
    });

    describe('hasClaimAsync', () => {
      it('should return true when user has claim', async () => {
        const claim = new Claim('role', 'admin');
        testUser.claims = [claim];

        const result = await userManager.hasClaimAsync(testUser, claim);

        expect(result).toBe(true);
      });

      it('should return false when user does not have claim', async () => {
        testUser.claims = [new Claim('role', 'user')];

        const result = await userManager.hasClaimAsync(testUser, new Claim('role', 'admin'));

        expect(result).toBe(false);
      });
    });
  });

  // ==================== ROLE MANAGEMENT ====================
  describe('Role Management', () => {
    describe('addToRoleAsync', () => {
      it('should add role successfully', async () => {
        const result = await userManager.addToRoleAsync(testUser, 'admin');

        expect(result.succeeded).toBe(true);
        expect(testUser.roles).toContain('admin');
      });

      it('should fail when user already in role', async () => {
        testUser.roles = ['admin'];

        const result = await userManager.addToRoleAsync(testUser, 'admin');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('DuplicateRole');
      });
    });

    describe('addToRolesAsync', () => {
      it('should add multiple roles', async () => {
        const result = await userManager.addToRolesAsync(testUser, ['admin', 'moderator']);

        expect(result.succeeded).toBe(true);
        expect(testUser.roles).toContain('admin');
        expect(testUser.roles).toContain('moderator');
      });

      it('should not duplicate existing roles', async () => {
        testUser.roles = ['admin'];

        await userManager.addToRolesAsync(testUser, ['admin', 'moderator']);

        expect(testUser.roles).toHaveLength(2);
      });
    });

    describe('removeFromRoleAsync', () => {
      it('should remove role successfully', async () => {
        testUser.roles = ['admin', 'moderator'];

        const result = await userManager.removeFromRoleAsync(testUser, 'admin');

        expect(result.succeeded).toBe(true);
        expect(testUser.roles).not.toContain('admin');
      });

      it('should fail when user not in role', async () => {
        testUser.roles = ['moderator'];

        const result = await userManager.removeFromRoleAsync(testUser, 'admin');

        expect(result.succeeded).toBe(false);
      });

      it('should fail when user has no roles', async () => {
        const result = await userManager.removeFromRoleAsync(testUser, 'admin');

        expect(result.succeeded).toBe(false);
      });
    });

    describe('removeFromRolesAsync', () => {
      it('should remove multiple roles', async () => {
        testUser.roles = ['admin', 'moderator', 'user'];

        const result = await userManager.removeFromRolesAsync(testUser, ['admin', 'moderator']);

        expect(result.succeeded).toBe(true);
        expect(testUser.roles).toEqual(['user']);
      });
    });

    describe('getRolesAsync', () => {
      it('should get all roles', async () => {
        testUser.roles = ['admin', 'moderator'];

        const result = await userManager.getRolesAsync(testUser);

        expect(result).toEqual(['admin', 'moderator']);
      });

      it('should return empty array when user has no roles', async () => {
        const result = await userManager.getRolesAsync(testUser);

        expect(result).toEqual([]);
      });
    });

    describe('isInRoleAsync', () => {
      it('should return true when user is in role', async () => {
        testUser.roles = ['admin'];

        const result = await userManager.isInRoleAsync(testUser, 'admin');

        expect(result).toBe(true);
      });

      it('should return false when user is not in role', async () => {
        testUser.roles = ['moderator'];

        const result = await userManager.isInRoleAsync(testUser, 'admin');

        expect(result).toBe(false);
      });
    });

    describe('getUsersInRoleAsync', () => {
      it('should get users in role', async () => {
        const user1 = { ...testUser, roles: ['admin'] };
        const user2 = { ...testUser, roles: ['user'] };
        const user3 = { ...testUser, roles: ['admin', 'moderator'] };

        const result = await userManager.getUsersInRoleAsync([user1, user2, user3], 'admin');

        expect(result).toHaveLength(2);
        expect(result).toContain(user1);
        expect(result).toContain(user3);
      });
    });
  });

  // ==================== LOCKOUT MANAGEMENT ====================
  describe('Lockout Management', () => {
    describe('accessFailedAsync', () => {
      it('should increment access failed count', async () => {
        testUser.accessFailedCount = 0;

        await userManager.accessFailedAsync(testUser);

        expect(testUser.accessFailedCount).toBe(1);
      });
    });

    describe('resetAccessFailedCountAsync', () => {
      it('should reset access failed count', async () => {
        testUser.accessFailedCount = 5;

        await userManager.resetAccessFailedCountAsync(testUser);

        expect(testUser.accessFailedCount).toBe(0);
      });
    });

    describe('getAccessFailedCountAsync', () => {
      it('should get access failed count', async () => {
        testUser.accessFailedCount = 3;

        const result = await userManager.getAccessFailedCountAsync(testUser);

        expect(result).toBe(3);
      });

      it('should return 0 when count is undefined', async () => {
        testUser.accessFailedCount = undefined;

        const result = await userManager.getAccessFailedCountAsync(testUser);

        expect(result).toBe(0);
      });
    });

    describe('setLockoutEnabledAsync', () => {
      it('should enable lockout', async () => {
        await userManager.setLockoutEnabledAsync(testUser, true);

        expect(testUser.lockoutEnabled).toBe(true);
      });
    });

    describe('getLockoutEnabledAsync', () => {
      it('should get lockout enabled status', async () => {
        testUser.lockoutEnabled = true;

        const result = await userManager.getLockoutEnabledAsync(testUser);

        expect(result).toBe(true);
      });
    });

    describe('setLockoutEndDateAsync', () => {
      it('should set lockout end date', async () => {
        const date = new Date();

        await userManager.setLockoutEndDateAsync(testUser, date);

        expect(testUser.lockoutEnd).toEqual(date);
      });
    });

    describe('getLockoutEndDateAsync', () => {
      it('should get lockout end date', async () => {
        const date = new Date();
        testUser.lockoutEnd = date;

        const result = await userManager.getLockoutEndDateAsync(testUser);

        expect(result).toEqual(date);
      });

      it('should return null when no lockout end date', async () => {
        const result = await userManager.getLockoutEndDateAsync(testUser);

        expect(result).toBeNull();
      });
    });
  });

  // ==================== TWO-FACTOR AUTHENTICATION ====================
  describe('Two-Factor Authentication', () => {
    describe('setTwoFactorEnabledAsync', () => {
      it('should enable two-factor', async () => {
        await userManager.setTwoFactorEnabledAsync(testUser, true);

        expect(testUser.twoFactorEnabled).toBe(true);
      });
    });

    describe('getTwoFactorEnabledAsync', () => {
      it('should get two-factor enabled status', async () => {
        testUser.twoFactorEnabled = true;

        const result = await userManager.getTwoFactorEnabledAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when not enabled', async () => {
        const result = await userManager.getTwoFactorEnabledAsync(testUser);

        expect(result).toBe(false);
      });
    });
  });

  // ==================== SECURITY STAMP ====================
  describe('Security Stamp', () => {
    describe('updateSecurityStampAsync', () => {
      it('should update security stamp', async () => {
        await userManager.updateSecurityStampAsync(testUser);

        expect(typeof testUser.securityStamp).toBe("string");
        expect(testUser.securityStamp).toHaveLength(36); // UUID length
        expect(testUser.securityStamp).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });
    });

    describe('getSecurityStampAsync', () => {
      it('should get security stamp', async () => {
        testUser.securityStamp = 'stamp-123';

        const result = await userManager.getSecurityStampAsync(testUser);

        expect(result).toBe('stamp-123');
      });

      it('should return null when no stamp', async () => {
        const result = await userManager.getSecurityStampAsync(testUser);

        expect(result).toBeNull();
      });
    });
  });

  // ==================== UTILITY ====================
  describe('Utility', () => {
    describe('generateConcurrencyStampAsync', () => {
      it('should generate concurrency stamp', async () => {
        const result = await userManager.generateConcurrencyStampAsync(testUser);

        expect(typeof result).toBe("string");
        expect(result).toHaveLength(36); // UUID length
        expect(result).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });
    });

    describe('normalizeName', () => {
      it('should convert name to uppercase', () => {
        const result = userManager['normalizeName']('john');

        expect(result).toBe('JOHN');
      });

      it('should return null for null input', () => {
        const result = userManager['normalizeName'](null);

        expect(result).toBeNull();
      });
    });

    describe('normalizeEmail', () => {
      it('should convert email to lowercase', () => {
        const result = userManager['normalizeEmail']('Test@Example.COM');

        expect(result).toBe('test@example.com');
      });

      it('should return null for null input', () => {
        const result = userManager['normalizeEmail'](null);

        expect(result).toBeNull();
      });
    });

    describe('updateNormalizedUserNameAsync', () => {
      it('should update normalized username', async () => {
        testUser.userName = 'john';

        await userManager.updateNormalizedUserNameAsync(testUser);

        expect(testUser.userName).toBe('JOHN');
        expect(mockStore.update).toHaveBeenCalled();
      });
    });

    describe('updateNormalizedEmailAsync', () => {
      it('should update normalized email', async () => {
        testUser.email = 'Test@Example.COM';

        await userManager.updateNormalizedEmailAsync(testUser);

        expect(testUser.email).toBe('test@example.com');
        expect(mockStore.update).toHaveBeenCalled();
      });
    });
  });

  // ==================== TOKEN MANAGEMENT ====================
  describe('Token Management', () => {
    describe('generatePasswordResetTokenAsync', () => {
      it('should generate password reset token', async () => {
        const result = await userManager.generatePasswordResetTokenAsync(testUser);

        expect(typeof result).toBe("string");
        expect(result).toHaveLength(36); // UUID length
        expect(result).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });
    });

    describe('generateEmailConfirmationTokenAsync', () => {
      it('should generate email confirmation token', async () => {
        const result = await userManager.generateEmailConfirmationTokenAsync(testUser);

        expect(typeof result).toBe("string");
        expect(result).toHaveLength(36); // UUID length
        expect(result).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });
    });

    describe('verifyPasswordResetTokenAsync', () => {
      it('should verify password reset token', async () => {
        testUser.securityStamp = 'token-123';

        const result = await userManager.verifyPasswordResetTokenAsync(testUser, 'token-123');

        expect(result).toBe(true);
      });

      it('should return false for invalid token', async () => {
        testUser.securityStamp = 'token-123';

        const result = await userManager.verifyPasswordResetTokenAsync(testUser, 'wrong-token');

        expect(result).toBe(false);
      });
    });

    describe('verifyEmailConfirmationTokenAsync', () => {
      it('should verify email confirmation token', async () => {
        testUser.securityStamp = 'token-123';

        const result = await userManager.verifyEmailConfirmationTokenAsync(testUser, 'token-123');

        expect(result).toBe(true);
      });
    });
  });

  // ==================== PHONE NUMBER MANAGEMENT ====================
  describe('Phone Number Management', () => {
    describe('setPhoneNumberAsync', () => {
      it('should set phone number successfully', async () => {
        const result = await userManager.setPhoneNumberAsync(testUser, '+1234567890');

        expect(result.succeeded).toBe(true);
        expect(testUser.phoneNumber).toBe('+1234567890');
        expect(testUser.phoneNumberConfirmed).toBe(false);
      });

      it('should handle set phone number error', async () => {
        vi.mocked(mockStore.update).mockRejectedValueOnce(new Error('Update failed'));

        const result = await userManager.setPhoneNumberAsync(testUser, '+1234567890');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('SetPhoneNumberFailed');
      });
    });

    describe('getPhoneNumberAsync', () => {
      it('should get phone number', async () => {
        testUser.phoneNumber = '+1234567890';

        const result = await userManager.getPhoneNumberAsync(testUser);

        expect(result).toBe('+1234567890');
      });

      it('should return null when no phone number', async () => {
        const result = await userManager.getPhoneNumberAsync(testUser);

        expect(result).toBeNull();
      });
    });

    describe('confirmPhoneNumberAsync', () => {
      it('should confirm phone number', async () => {
        testUser.phoneNumber = '+1234567890';

        const result = await userManager.confirmPhoneNumberAsync(testUser);

        expect(result.succeeded).toBe(true);
        expect(testUser.phoneNumberConfirmed).toBe(true);
      });

      it('should fail when no phone number', async () => {
        const result = await userManager.confirmPhoneNumberAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('Invalid');
      });
    });
  });

  // ==================== EXTERNAL LOGIN MANAGEMENT ====================
  describe('External Login Management', () => {
    describe('addLoginAsync', () => {
      it('should add external login', async () => {
        const result = await userManager.addLoginAsync(testUser, 'google', 'google-123');

        expect(result.succeeded).toBe(true);
        expect(testUser.logins).toContainEqual({ loginProvider: 'google', providerKey: 'google-123' });
      });
    });

    describe('removeLoginAsync', () => {
      it('should remove external login', async () => {
        testUser.logins = [{ loginProvider: 'google', providerKey: 'google-123' }];

        const result = await userManager.removeLoginAsync(testUser, 'google', 'google-123');

        expect(result.succeeded).toBe(true);
        expect(testUser.logins).toHaveLength(0);
      });

      it('should fail when user has no logins', async () => {
        const result = await userManager.removeLoginAsync(testUser, 'google', 'google-123');

        expect(result.succeeded).toBe(false);
      });
    });

    describe('getLoginsAsync', () => {
      it('should get all external logins', async () => {
        testUser.logins = [
          { loginProvider: 'google', providerKey: 'google-123' },
          { loginProvider: 'facebook', providerKey: 'fb-456' },
        ];

        const result = await userManager.getLoginsAsync(testUser);

        expect(result).toHaveLength(2);
      });

      it('should return empty array when no logins', async () => {
        const result = await userManager.getLoginsAsync(testUser);

        expect(result).toEqual([]);
      });
    });
  });

  // ==================== RECOVERY CODES ====================
  describe('Recovery Codes', () => {
    describe('generateRecoveryCodesAsync', () => {
      it('should generate recovery codes', async () => {
        const result = await userManager.generateRecoveryCodesAsync(testUser, 10);

        expect(result).toHaveLength(10);
        expect(testUser.recoveryCodes).toHaveLength(10);
      });
    });

    describe('redeemRecoveryCodeAsync', () => {
      it('should redeem valid recovery code', async () => {
        testUser.recoveryCodes = ['code1', 'code2', 'code3'];

        const result = await userManager.redeemRecoveryCodeAsync(testUser, 'code2');

        expect(result).toBe(true);
        expect(testUser.recoveryCodes).toEqual(['code1', 'code3']);
      });

      it('should return false for invalid code', async () => {
        testUser.recoveryCodes = ['code1', 'code2'];

        const result = await userManager.redeemRecoveryCodeAsync(testUser, 'invalid');

        expect(result).toBe(false);
      });
    });

    describe('getRecoveryCodesAsync', () => {
      it('should get recovery codes', async () => {
        testUser.recoveryCodes = ['code1', 'code2'];

        const result = await userManager.getRecoveryCodesAsync(testUser);

        expect(result).toEqual(['code1', 'code2']);
      });

      it('should return empty array when no codes', async () => {
        const result = await userManager.getRecoveryCodesAsync(testUser);

        expect(result).toEqual([]);
      });
    });
  });

  // ==================== SIGN-IN & LOCKOUT HELPERS ====================
  describe('Sign-In & Lockout Helpers', () => {
    describe('isLockedOutAsync', () => {
      it('should return true when locked out', async () => {
        testUser.lockoutEnabled = true;
        testUser.lockoutEnd = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes in future

        const result = await userManager.isLockedOutAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when lockout disabled', async () => {
        testUser.lockoutEnabled = false;

        const result = await userManager.isLockedOutAsync(testUser);

        expect(result).toBe(false);
      });

      it('should return false when lockout expired', async () => {
        testUser.lockoutEnabled = true;
        testUser.lockoutEnd = new Date(Date.now() - 1000); // 1 second ago

        const result = await userManager.isLockedOutAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('canSignInAsync', () => {
      it('should return true when user can sign in', async () => {
        const result = await userManager.canSignInAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when user is locked out', async () => {
        testUser.lockoutEnabled = true;
        testUser.lockoutEnd = new Date(Date.now() + 1000 * 60 * 5);

        const result = await userManager.canSignInAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('accessFailedAndLockoutAsync', () => {
      it('should increment failed count', async () => {
        testUser.accessFailedCount = 0;

        await userManager.accessFailedAndLockoutAsync(testUser, 5);

        expect(testUser.accessFailedCount).toBe(1);
      });

      it('should lock out after max attempts', async () => {
        testUser.accessFailedCount = 4;

        await userManager.accessFailedAndLockoutAsync(testUser, 5);

        expect(testUser.lockoutEnd).toBeDefined();
        expect(testUser.lockoutEnd).toBeInstanceOf(Date);
      });
    });

    describe('clearLockoutAsync', () => {
      it('should clear lockout state', async () => {
        testUser.accessFailedCount = 5;
        testUser.lockoutEnd = new Date();

        await userManager.clearLockoutAsync(testUser);

        expect(testUser.accessFailedCount).toBe(0);
        expect(testUser.lockoutEnd).toBeNull();
      });
    });
  });

  // ==================== USER STATUS & LIFECYCLE ====================
  describe('User Status & Lifecycle', () => {
    describe('isEmailConfirmedAsync', () => {
      it('should return true when email exists', async () => {
        testUser.email = 'test@example.com';

        const result = await userManager.isEmailConfirmedAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when no email', async () => {
        testUser.email = undefined;

        const result = await userManager.isEmailConfirmedAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('isPhoneNumberConfirmedAsync', () => {
      it('should return true when confirmed', async () => {
        testUser.phoneNumberConfirmed = true;

        const result = await userManager.isPhoneNumberConfirmedAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when not confirmed', async () => {
        const result = await userManager.isPhoneNumberConfirmedAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('hasPasswordAsync', () => {
      it('should return true when password hash exists', async () => {
        testUser.passwordHash = 'hashed';

        const result = await userManager.hasPasswordAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when no password', async () => {
        const result = await userManager.hasPasswordAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('refreshSignInAsync', () => {
      it('should refresh sign in by updating security stamp', async () => {
        await userManager.refreshSignInAsync(testUser);

        expect(testUser.isSignedIn).toBe(true);
        expect(typeof testUser.securityStamp).toBe("string");
        expect(testUser.securityStamp).toHaveLength(36); // UUID length
        expect(testUser.securityStamp).toMatch(/[0-9a-f\-]{36}/); // regex for UUID
      });
    });
  });

  // ==================== SIGN-IN LIFECYCLE ====================
  describe('Sign-In Lifecycle', () => {
    describe('signInAsync', () => {
      it('should sign in user successfully', async () => {
        const result = await userManager.signInAsync(testUser);

        expect(result.succeeded).toBe(true);
        expect(testUser.isSignedIn).toBe(true);
      });

      it('should fail when user is locked out', async () => {
        testUser.lockoutEnabled = true;
        testUser.lockoutEnd = new Date(Date.now() + 1000 * 60 * 5);

        const result = await userManager.signInAsync(testUser);

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('LockedOut');
      });
    });

    describe('signOutAsync', () => {
      it('should sign out user', async () => {
        testUser.isSignedIn = true;

        await userManager.signOutAsync(testUser);

        expect(testUser.isSignedIn).toBe(false);
      });
    });

    describe('isSignedInAsync', () => {
      it('should return true when signed in', async () => {
        testUser.isSignedIn = true;

        const result = await userManager.isSignedInAsync(testUser);

        expect(result).toBe(true);
      });

      it('should return false when not signed in', async () => {
        const result = await userManager.isSignedInAsync(testUser);

        expect(result).toBe(false);
      });
    });

    describe('passwordSignInAsync', () => {
      it('should sign in with correct password', async () => {
        testUser.passwordHash = 'hashed-password';

        const result = await userManager.passwordSignInAsync(testUser, 'password123');

        expect(result.succeeded).toBe(true);
        expect(testUser.isSignedIn).toBe(true);
      });

      it('should fail with incorrect password and increment failed count', async () => {
        testUser.passwordHash = 'hashed-password';
        testUser.accessFailedCount = 0;
        vi.mocked(mockHasher.verify).mockResolvedValueOnce(false);

        const result = await userManager.passwordSignInAsync(testUser, 'wrongpassword');

        expect(result.succeeded).toBe(false);
        expect(testUser.accessFailedCount).toBe(1);
      });
    });

    describe('recoveryCodeSignInAsync', () => {
      it('should sign in with valid recovery code', async () => {
        testUser.recoveryCodes = ['code1', 'code2'];

        const result = await userManager.recoveryCodeSignInAsync(testUser, 'code1');

        expect(result.succeeded).toBe(true);
        expect(testUser.isSignedIn).toBe(true);
        expect(testUser.recoveryCodes).toEqual(['code2']);
      });

      it('should fail with invalid recovery code', async () => {
        testUser.recoveryCodes = ['code1'];

        const result = await userManager.recoveryCodeSignInAsync(testUser, 'invalid');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('InvalidCode');
      });
    });

    describe('externalLoginSignInAsync', () => {
      it('should sign in with external login', async () => {
        testUser.logins = [{ loginProvider: 'google', providerKey: 'google-123' }];

        const result = await userManager.externalLoginSignInAsync(testUser, 'google', 'google-123');

        expect(result.succeeded).toBe(true);
        expect(testUser.isSignedIn).toBe(true);
      });

      it('should fail with invalid external login', async () => {
        testUser.logins = [{ loginProvider: 'google', providerKey: 'google-123' }];

        const result = await userManager.externalLoginSignInAsync(testUser, 'facebook', 'fb-456');

        expect(result.succeeded).toBe(false);
        expect(result.errors[0].code).toBe('InvalidLogin');
      });
    });
  });

  // ==================== ADVANCED ROLE HELPERS ====================
  describe('Advanced Role Helpers', () => {
    describe('getUsersInRolesAsync', () => {
      it('should get users in specified roles', async () => {
        const user1 = { ...testUser, roles: ['admin'] };
        const user2 = { ...testUser, roles: ['user'] };
        const user3 = { ...testUser, roles: ['admin', 'moderator'] };

        const result = await userManager.getUsersInRolesAsync([user1, user2, user3], ['admin', 'moderator']);

        expect(result).toHaveLength(2);
        expect(result).toContain(user1);
        expect(result).toContain(user3);
      });
    });

    describe('clearRolesAsync', () => {
      it('should remove all roles', async () => {
        testUser.roles = ['admin', 'moderator', 'user'];

        await userManager.clearRolesAsync(testUser);

        expect(testUser.roles).toEqual([]);
      });
    });
  });

  // ==================== IDENTITY RESULT & ERROR ====================
  describe('IdentityResult and IdentityError', () => {
    it('should create success result', () => {
      const result = IdentityResult.success();

      expect(result.succeeded).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create failed result', () => {
      const errors = [new IdentityError('Code', 'Description')];
      const result = IdentityResult.failed(errors);

      expect(result.succeeded).toBe(false);
      expect(result.errors).toEqual(errors);
    });

    it('should create identity error', () => {
      const error = new IdentityError('ErrorCode', 'Error description');

      expect(error.code).toBe('ErrorCode');
      expect(error.description).toBe('Error description');
    });
  });

  // ==================== CLAIM ====================
  describe('Claim', () => {
    it('should create claim', () => {
      const claim = new Claim('role', 'admin');

      expect(claim.type).toBe('role');
      expect(claim.value).toBe('admin');
    });
  });
});
