import {
    IUserAuthenticationTokenStore,
    IUserAuthenticatorKeyStore,
    IUserTwoFactorRecoveryCodeStore,
    IUserTwoFactorStore,
    IUserPasswordStore,
    IUserSecurityStampStore,
    IUserRoleStore,
    IUserLoginStore,
    IUserEmailStore,
    IUserPhoneNumberStore,
    IUserClaimStore,
    IUserLockoutStore,
    IQueryableUserStore,
    ILookupNormalizer,
    IPasswordHasher,
    IUserTwoFactorTokenProvider,
    UserTwoFactorTokenProviderFactory,
    PasswordHasher,
    LookupNormalizer,
} from "../extensions/index.js";
import { Claim, ClaimsPrincipal } from "../../claims/index.js";
import { IClaim } from "../../claims/types.js";
import { IdentityErrorDescriber } from "./identity.error.describer.js";
import { IdentityResult } from "./identity.result.js";
import { IdentityOptions } from "../options/index.js";
import { IdentityRole, IdentityUser, PasswordVerificationResult, UserLoginInfo } from "../types/index.js";
import { IPasswordValidator, IUserValidator, PasswordValidator, UserValidator } from "../validators/index.js";
import { IdentityError } from "./identity.error.js";
import { generateBase32, randomUUID } from "../../utils.js";
import { CancellationToken } from "../../types/cancellation.js";
import { IOptions } from "../../types/index.js";
import { DefaultAuthenticatorKeyStore, DefaultTwoFactorRecoveryCodeStore, DefaultUserAuthenticationTokenStore, DefaultUserClaimStore, DefaultUserEmailStore, DefaultUserLockoutStore, DefaultUserLoginStore, DefaultUserPasswordStore, DefaultUserPhoneNumberStore, DefaultUserRoleStore, DefaultUserSecurityStampStore, DefaultUserTwoFactorStore, UserStore } from "../extensions/user-stores/index.js";
import { IQueryable } from "../../linq/index.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { IdentityDbContext } from "../contexts/index.js";
import { Inject } from "../../decorators/index.js";
import { IUserManager } from "./user.manager.js";

/**
 * Provides the APIs for managing user in a persistence store.
 * @typeparam TUser The type encapsulating a user.
 */
export class UserManager<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserManager<TKey, TUser>, Disposable {
   
    /** The data protection purpose used for the reset password related methods. */
    public static readonly resetPasswordTokenPurpose: string = "ResetPassword";

    /** The data protection purpose used for the change phone number methods. */
    public static readonly changePhoneNumberTokenPurpose: string = "ChangePhoneNumber";

    /** The data protection purpose used for the email confirmation related methods. */
    public static readonly confirmEmailTokenPurpose: string = "EmailConfirmation";

    private readonly _tokenProviders: Map<string, IUserTwoFactorTokenProvider<TKey, TUser>>;
    private _disposed: boolean;
    private cancellationToken: CancellationToken = CancellationToken.none;

    protected readonly store         : UserStore<TUser, IdentityRole<TKey>, TKey, IdentityDbContext<TUser, IdentityRole<TKey>, TKey>>;
    protected readonly passwordHasher: IPasswordHasher<TUser>;
    protected readonly userValidators: IUserValidator<TKey, TUser>[] = [];
    protected readonly passwordValidators: IPasswordValidator<TKey, TUser>[] = [];
    protected readonly keyNormalizer : ILookupNormalizer;
    protected readonly errorDescriber: IdentityErrorDescriber;

    public readonly options : IdentityOptions;
    constructor(
        @Inject(UserStore) store : UserStore<TUser, IdentityRole<TKey>, TKey, IdentityDbContext<TUser, IdentityRole<TKey>, TKey>>,
        @Inject(PasswordHasher) passwordHasher  : IPasswordHasher<TUser>,
        @Inject([UserValidator]) userValidators : IUserValidator<TKey, TUser>[],
        @Inject([PasswordValidator]) passwordValidators: IPasswordValidator<TKey, TUser>[],
        @Inject(LookupNormalizer) keyNormalizer : ILookupNormalizer,
        @Inject(IdentityOptions) optionsAccessor: IOptions<IdentityOptions>,
        errorDescriber  : IdentityErrorDescriber,
    ) {
        this.store          = store;
        this.passwordHasher = passwordHasher;
        this.keyNormalizer  = keyNormalizer;
        this.errorDescriber = errorDescriber;
        this.options        = optionsAccessor?.value ?? new IdentityOptions();

        if (userValidators) {
            if (Array.isArray(userValidators))
                this.userValidators.push(...userValidators);
            else
                this.userValidators.push(userValidators);
        }
        if (passwordValidators) {
            if (Array.isArray(passwordValidators))
                this.passwordValidators.push(...passwordValidators);
            else
                this.passwordValidators.push(passwordValidators);
        }
        this._tokenProviders = new Map<string, IUserTwoFactorTokenProvider<TKey, TUser>>([ ]);
        const tokenProviders = UserTwoFactorTokenProviderFactory.defaultTokenProviders();

        for (const [key, provider] of tokenProviders) {
            if (provider) {
                this.registerTokenProvider(key, provider);
            }
        }

        this._disposed = false;
    }
    [Symbol.
        dispose](): void {
        this.store.dispose()
    }

    /** Releases all resources used by the user manager. */
    dispose(): void {
        // Stub: implement disposal logic
        this._disposed = true
    }

    /** Gets a flag indicating whether the backing user store supports authentication tokens. */
    get supportsUserAuthenticationTokens(): boolean {
        return (this.store as IUserAuthenticationTokenStore<TKey, TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports a user authenticator. */
    get supportsUserAuthenticatorKey(): boolean {
        return (this.store as IUserAuthenticatorKeyStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports recovery codes. */
    get supportsUserTwoFactorRecoveryCodes(): boolean {
        return (this.store as IUserTwoFactorRecoveryCodeStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports two factor authentication. */
    get supportsUserTwoFactor(): boolean {
        return (this.store as IUserTwoFactorStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user passwords. */
    get supportsUserPassword(): boolean {
        return (this.store as IUserPasswordStore<TKey, TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports security stamps. */
    get supportsUserSecurityStamp(): boolean {
        return (this.store as IUserSecurityStampStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user roles. */
    get supportsUserRole(): boolean {
        return (this.store as IUserRoleStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports external logins. */
    get supportsUserLogin(): boolean {
        return (this.store as IUserLoginStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user emails. */
    get supportsUserEmail(): boolean {
        return (this.store as IUserEmailStore<TKey, TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user telephone numbers. */
    get supportsUserPhoneNumber(): boolean {
        return (this.store as IUserPhoneNumberStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user claims. */
    get supportsUserClaim(): boolean {
        return (this.store as IUserClaimStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports user lock-outs. */
    get supportsUserLockout(): boolean {
        return (this.store as IUserLockoutStore<TUser>) !== undefined;
    }

    /** Gets a flag indicating whether the backing user store supports returning IQueryable collections of information. */
    get supportsQueryableUsers(): boolean {
        return (this.store as IQueryableUserStore<TUser>) !== undefined;
    }

    /** Returns an IQueryable of users if the store is an IQueryableUserStore. */
    get users(): IQueryable<TUser> {
        const queryableStore = this.store as IQueryableUserStore<TUser>;
        if (!queryableStore) {
            throw new Error("Store does not implement IQueryableUserStore.");
        }
        return queryableStore.users;
    }

    /**
     * Returns the Name claim value if present otherwise returns null.
     * @param principal The ClaimsPrincipal instance.
     * @returns The Name claim value, or null if the claim is not present.
     * @remarks The Name claim is identified by ClaimsIdentity.DefaultNameClaimType.
     */
    getUserName(principal: ClaimsPrincipal): string | null {
        if (!principal) throw new Error("principal cannot be null");
        return principal.findFirstValue(this.options.claimsIdentity.userNameClaimType) ?? null;
    }

    /**
     * Returns the User ID claim value if present otherwise returns null.
     * @param principal The ClaimsPrincipal instance.
     * @returns The User ID claim value, or null if the claim is not present.
     * @remarks The User ID claim is identified by ClaimTypes.NameIdentifier.
     */
    getUserId(principal: ClaimsPrincipal): string | null {
        if (!principal) throw new Error("principal cannot be null");
        return principal.findFirstValue(this.options.claimsIdentity.userIdClaimType) ?? null;
    }

    /**
     * Returns the user corresponding to the IdentityOptions.ClaimsIdentity.UserIdClaimType claim in
     * the principal or null.
     * @param principal The principal which contains the user id claim.
     * @returns The user corresponding to the IdentityOptions.ClaimsIdentity.UserIdClaimType claim in the principal or null.
     */
    async getUserAsync(principal: ClaimsPrincipal): Promise<TUser | null> {
        if (!principal) throw new Error("principal cannot be null");
        const id = this.getUserId(principal);

        return id == null ? null : await this.findByIdAsync(id);
    }

    /**
     * Generates a value suitable for use in concurrency tracking.
     * @param user The user to generate the stamp for.
     * @returns A Promise containing the security stamp for the specified user.
     */
    async generateConcurrencyStampAsync(user: TUser): Promise<string> {
        return randomUUID();
    }

    /**
     * Creates the specified user in the backing store with no password.
     * @param user The user to create.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async createAsync(user: TUser): Promise<IdentityResult> {
        // Stub: implement metrics and validation logic
        return await this.createCoreAsync(user);
    }

    private async createCoreAsync(user: TUser): Promise<IdentityResult> {
        // Stub: implement security stamp, validation, normalization, and store creation
        return await this.store.createAsync(user, this.cancellationToken);
    }

    /**
     * Updates the specified user in the backing store.
     * @param user The user to update.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async updateAsync(user: TUser): Promise<IdentityResult> {
        // Stub: implement metrics and validation logic
        return await this.store.updateAsync(user, this.cancellationToken);
    }

    /**
     * Deletes the specified user from the backing store.
     * @param user The user to delete.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async deleteAsync(user: TUser): Promise<IdentityResult> {
        // Stub: implement metrics and validation logic
        return await this.store.deleteAsync(user, this.cancellationToken);
    }

    /**
     * Finds and returns a user, if any, who has the specified userId.
     * @param userId The user ID to search for.
     * @returns A Promise containing the user matching the specified userId if it exists.
     */
    async findByIdAsync(userId: string): Promise<TUser | null> {
        return await this.store.findByIdAsync(userId, this.cancellationToken);
    }

    /**
     * Finds and returns a user, if any, who has the specified user name.
     * @param userName The user name to search for.
     * @returns A Promise containing the user matching the specified userName if it exists.
     */
    async findByNameAsync(userName: string): Promise<TUser | null> {
        if (!userName) throw new Error("userName cannot be null");
        userName = this.normalizeName(userName)!;
        return await this.store.findByNameAsync(userName, this.cancellationToken);
    }

    /**
     * Creates the specified user in the backing store with given password.
     * @param user The user to create.
     * @param password The password for the user to hash and store.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async createWithPasswordAsync(user: TUser, password: string): Promise<IdentityResult> {
        if (!user) throw new Error("user cannot be null");
        if (!password) throw new Error("password cannot be null");
        // Stub: implement password hashing and creation
        return await this.createAsync(user);
    }

    /**
     * Normalize user or role name for consistent comparisons.
     * @param name The name to normalize.
     * @returns A normalized value representing the specified name.
     */
    normalizeName(name: string | null): string | null {
        return this.keyNormalizer ? this.keyNormalizer.normalizeName(name) : name;
    }

    /**
     * Normalize email for consistent comparisons.
     * @param email The email to normalize.
     * @returns A normalized value representing the specified email.
     */
    normalizeEmail(email: string | null): string | null {
        return this.keyNormalizer ? this.keyNormalizer.normalizeEmail(email) : email;
    }

    /**
     * Gets the user name for the specified user.
     * @param user The user whose name should be retrieved.
     * @returns A Promise containing the name for the specified user.
     */
    async getUserNameAsync(user: TUser): Promise<string | null> {
        if (!user) throw new Error("user cannot be null");
        return await this.store.getUserNameAsync(user, this.cancellationToken);
    }

    /**
     * Sets the given userName for the specified user.
     * @param user The user whose name should be set.
     * @param userName The user name to set.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setUserNameAsync(user: TUser, userName: string | null): Promise<IdentityResult> {
        if (!user) throw new Error("user cannot be null");
        await this.store.setUserNameAsync(user, userName, this.cancellationToken);
        // Stub: implement security stamp update and metrics
        return {} as IdentityResult;
    }

        /**
     * Gets the user identifier for the specified user.
     * @param user The user whose identifier should be retrieved.
     * @returns A Promise containing the identifier for the specified user.
     */
    async getUserIdAsync(user: TUser): Promise<string> {
        return await this.store.getUserIdAsync(user, this.cancellationToken);
    }

    /**
     * Returns a flag indicating whether the given password is valid for the specified user.
     * @param user The user whose password should be validated.
     * @param password The password to validate.
     * @returns A Promise containing true if the specified password matches the one stored for the user, otherwise false.
     */
    async checkPasswordAsync(user: TUser, password: string): Promise<boolean> {
        const { result, userMissing } = await this.checkPasswordCoreAsync(user, password);
        if (result === PasswordVerificationResult.Failed) {
            return false;
        }
        return result != null;
    }

    private async checkPasswordCoreAsync(user: TUser, password: string): Promise<{ result: PasswordVerificationResult | null, userMissing: boolean }> {
        const passwordStore = this.getPasswordStore();
        if (user == null) {
            return { result: null, userMissing: true };
        }
        const result = await this.verifyPasswordAsync(passwordStore, user, password);
        if (result === PasswordVerificationResult.SuccessRehashNeeded) {
            await this.updatePasswordHash(user, password, false);
            await this.updateUserAsync(user);
        }
        return { result, userMissing: false };
    }

    /**
     * Gets a flag indicating whether the specified user has a password.
     * @param user The user to return a flag for.
     * @returns A Promise returning true if the specified user has a password, otherwise false.
     */
    async hasPasswordAsync(user: TUser): Promise<boolean> {
        const passwordStore = this.getPasswordStore();
        return await passwordStore.hasPasswordAsync(user, this.cancellationToken);
    }

    /**
     * Adds the password to the specified user only if the user does not already have a password.
     * @param user The user whose password should be set.
     * @param password The password to set.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addPasswordAsync(user: TUser, password: string): Promise<IdentityResult> {
        return await this.addPasswordCoreAsync(user, password);
    }

    private async addPasswordCoreAsync(user: TUser, password: string): Promise<IdentityResult> {
        const passwordStore = this.getPasswordStore();
        const hash = await passwordStore.getPasswordHashAsync(user, this.cancellationToken);
        if (hash != null) {
            return IdentityResult.failed([this.errorDescriber.userAlreadyHasPassword()]);
        }
        const result = await this.updatePasswordHash(user, password, true);
        if (!result.succeeded) {
            return result;
        }
        return await this.updateUserAsync(user);
    }

    /**
     * Changes a user's password after confirming the specified currentPassword is correct.
     * @param user The user whose password should be set.
     * @param currentPassword The current password to validate before changing.
     * @param newPassword The new password to set.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async changePasswordAsync(user: TUser, currentPassword: string, newPassword: string): Promise<IdentityResult> {
        return await this.changePasswordCoreAsync(user, currentPassword, newPassword);
    }

    private async changePasswordCoreAsync(user: TUser, currentPassword: string, newPassword: string): Promise<IdentityResult> {
        const passwordStore = this.getPasswordStore();
        if (await this.verifyPasswordAsync(passwordStore, user, currentPassword) !== PasswordVerificationResult.Failed) {
            const updateResult = await this.updatePasswordHash(user, newPassword, true);
            if (!updateResult.succeeded) {
                return updateResult;
            }
            return await this.updateUserAsync(user);
        }
        return IdentityResult.failed([this.errorDescriber.passwordMismatch()]);
    }

    /**
     * Removes a user's password.
     * @param user The user whose password should be removed.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removePasswordAsync(user: TUser): Promise<IdentityResult> {
        await this.updatePasswordHash(user, null as any, false);
        return await this.updateUserAsync(user);
    }

    /**
     * Returns a PasswordVerificationResult indicating the result of a password hash comparison.
     * @param store The store containing a user's password.
     * @param user The user whose password should be verified.
     * @param password The password to verify.
     * @returns A Promise containing the PasswordVerificationResult of the operation.
     */
    protected async verifyPasswordAsync(store: IUserPasswordStore<TKey, TUser>, user: TUser, password: string): Promise<PasswordVerificationResult> {
        const hash = await store.getPasswordHashAsync(user, this.cancellationToken);
        if (hash == null) {
            return PasswordVerificationResult.Failed;
        }
        return this.passwordHasher.verifyHashedPassword(user, hash, password);
    }

    /**
     * Get the security stamp for the specified user.
     * @param user The user whose security stamp should be retrieved.
     * @returns A Promise containing the security stamp for the specified user.
     */
    async getSecurityStampAsync(user: TUser): Promise<string> {
        const securityStore = this.getSecurityStore();
        const stamp = await securityStore.getSecurityStampAsync(user, this.cancellationToken);
        if (stamp == null) {
            throw new Error("Security stamp is null.");
        }
        return stamp;
    }

    /**
     * Regenerates the security stamp for the specified user.
     * @param user The user whose security stamp should be regenerated.
     * @returns A Promise containing the IdentityResult of the operation.
     * @remarks Regenerating a security stamp will sign out any saved login for the user.
     */
    async updateSecurityStampAsync(user: TUser): Promise<IdentityResult> {
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Generates a password reset token for the specified user, using
     * the configured password reset token provider.
     * @param user The user to generate a password reset token for.
     * @returns A Promise containing a password reset token for the specified user.
     */
    generatePasswordResetTokenAsync(user: TUser): Promise<string> {
        return this.generateUserTokenAsync(user, this.options.tokens.passwordResetTokenProvider, UserManager.resetPasswordTokenPurpose);
    }

    /**
     * Resets the user's password to the specified newPassword after
     * validating the given password reset token.
     * @param user The user whose password should be reset.
     * @param token The password reset token to verify.
     * @param newPassword The new password to set if reset token verification succeeds.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async resetPasswordAsync(user: TUser, token: string, newPassword: string): Promise<IdentityResult> {
        if (!await this.verifyUserTokenAsync(user, this.options.tokens.passwordResetTokenProvider, UserManager.resetPasswordTokenPurpose, token)) {
            return IdentityResult.failed([this.errorDescriber.invalidToken()]);
        }
        const result = await this.updatePasswordHash(user, newPassword, true);
        if (!result.succeeded) {
            return result;
        }
        return await this.updateUserAsync(user);
    }

    /**
     * Retrieves the user associated with the specified external login provider and login provider key.
     * @param loginProvider The login provider who provided the providerKey.
     * @param providerKey The key provided by the loginProvider to identify a user.
     * @returns A Promise containing the user, if any, which matched the specified login provider and key.
     */
    findByLoginAsync(loginProvider: string, providerKey: string): Promise<TUser | null> {
        const loginStore = this.getLoginStore();
        return loginStore.findByLoginAsync(loginProvider, providerKey, this.cancellationToken);
    }

    /**
     * Attempts to remove the provided external login information from the specified user.
     * @param user The user to remove the login information from.
     * @param loginProvider The login provider whose information should be removed.
     * @param providerKey The key given by the external login provider for the specified user.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removeLoginAsync(user: TUser, loginProvider: string, providerKey: string): Promise<IdentityResult> {
        const loginStore = this.getLoginStore();
        await loginStore.removeLoginAsync(user, loginProvider, providerKey, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Adds an external UserLoginInfo to the specified user.
     * @param user The user to add the login to.
     * @param login The external UserLoginInfo to add to the specified user.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addLoginAsync(user: TUser, login: UserLoginInfo): Promise<IdentityResult> {
        return await this.addLoginCoreAsync(user, login);
    }

    private async addLoginCoreAsync(user: TUser, login: UserLoginInfo): Promise<IdentityResult> {
        const loginStore = this.getLoginStore();
        const existingUser = await this.findByLoginAsync(login.loginProvider, login.providerKey);
        if (existingUser != null) {
            return IdentityResult.failed([this.errorDescriber.loginAlreadyAssociated()]);
        }
        await loginStore.addLoginAsync(user, login, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Retrieves the associated logins for the specified user.
     * @param user The user whose associated logins to retrieve.
     * @returns A Promise containing a list of UserLoginInfo for the specified user, if any.
     */
    async getLoginsAsync(user: TUser): Promise<UserLoginInfo[]> {
        const loginStore = this.getLoginStore();
        return await loginStore.getLoginsAsync(user, this.cancellationToken);
    }

    /**
     * Adds the specified claim to the user.
     * @param user The user to add the claim to.
     * @param claim The claim to add.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult> {
        return this.addClaimsAsync(user, [claim]);
    }

    /**
     * Adds the specified claims to the user.
     * @param user The user to add the claims to.
     * @param claims The claims to add.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addClaimsAsync(user: TUser, claims: Claim[]): Promise<IdentityResult> {
        const claimStore = this.getClaimStore();
        await claimStore.addClaimsAsync(user, claims, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Replaces the given claim on the specified user with the newClaim.
     * @param user The user to replace the claim on.
     * @param claim The claim to replace.
     * @param newClaim The new claim to replace the existing claim with.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async replaceClaimAsync(user: TUser, claim: Claim, newClaim: Claim): Promise<IdentityResult> {
        const claimStore = this.getClaimStore();
        await claimStore.replaceClaimAsync(user, claim, newClaim, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Removes the specified claim from the given user.
     * @param user The user to remove the claim from.
     * @param claim The claim to remove.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    removeClaimAsync(user: TUser, claim: Claim): Promise<IdentityResult> {
        return this.removeClaimsAsync(user, [claim]);
    }

    /**
     * Removes the specified claims from the given user.
     * @param user The user to remove the claims from.
     * @param claims A collection of claims to remove.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removeClaimsAsync(user: TUser, claims: Claim[]): Promise<IdentityResult> {
        const claimStore = this.getClaimStore();
        await claimStore.removeClaimsAsync(user, claims, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Gets a list of claims belonging to the specified user.
     * @param user The user whose claims to retrieve.
     * @returns A Promise containing a list of claims.
     */
    async getClaimsAsync(user: TUser): Promise<IClaim[]> {
        const claimStore = this.getClaimStore();
        return await claimStore.getClaimsAsync(user, this.cancellationToken);
    }

    /**
     * Add the specified user to the named role.
     * @param user The user to add to the named role.
     * @param role The name of the role to add the user to.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addToRoleAsync(user: TUser, role: string): Promise<IdentityResult> {
        return await this.addToRoleCoreAsync(user, role);
    }

    private async addToRoleCoreAsync(user: TUser, role: string): Promise<IdentityResult> {
        const userRoleStore = this.getUserRoleStore();
        const normalizedRole = this.normalizeName(role);
        if (await userRoleStore.isInRoleAsync(user, normalizedRole!, this.cancellationToken)) {
            return this.userAlreadyInRoleError(role);
        }
        await userRoleStore.addToRoleAsync(user, normalizedRole!, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Add the specified user to the named roles.
     * @param user The user to add to the named roles.
     * @param roles The names of the roles to add the user to.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async addToRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
        return await this.addToRolesCoreAsync(user, roles);
    }

    private async addToRolesCoreAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
        const userRoleStore = this.getUserRoleStore();
        for (const role of [...new Set(roles)]) {
            const normalizedRole = this.normalizeName(role);
            if (await userRoleStore.isInRoleAsync(user, normalizedRole!, this.cancellationToken)) {
                return this.userAlreadyInRoleError(role);
            }
            await userRoleStore.addToRoleAsync(user, normalizedRole!, this.cancellationToken);
        }
        return await this.updateUserAsync(user);
    }

        /**
     * Removes the specified user from the named role.
     * @param user The user to remove from the named role.
     * @param role The name of the role to remove the user from.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removeFromRoleAsync(user: TUser, role: string): Promise<IdentityResult> {
        const userRoleStore = this.getUserRoleStore();
        const normalizedRole = this.normalizeName(role);
        if (!await userRoleStore.isInRoleAsync(user, normalizedRole!, this.cancellationToken)) {
            return this.userNotInRoleError(role);
        }
        await userRoleStore.removeFromRoleAsync(user, normalizedRole!, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    private userAlreadyInRoleError(role: string): IdentityResult {
        return IdentityResult.failed(this.errorDescriber.userAlreadyInRole(role));
    }

    private userNotInRoleError(role: string): IdentityResult {
        return IdentityResult.failed(this.errorDescriber.userNotInRole(role));
    }

    /**
     * Removes the specified user from the named roles.
     * @param user The user to remove from the named roles.
     * @param roles The names of the roles to remove the user from.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removeFromRolesAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
        return await this.removeFromRolesCoreAsync(user, roles);
    }

    private async removeFromRolesCoreAsync(user: TUser, roles: string[]): Promise<IdentityResult> {
        const userRoleStore = this.getUserRoleStore();
        for (const role of roles) {
            const normalizedRole = this.normalizeName(role);
            if (!await userRoleStore.isInRoleAsync(user, normalizedRole!, this.cancellationToken)) {
                return this.userNotInRoleError(role);
            }
            await userRoleStore.removeFromRoleAsync(user, normalizedRole!, this.cancellationToken);
        }
        return await this.updateUserAsync(user);
    }

    /**
     * Gets a list of role names the specified user belongs to.
     * @param user The user whose role names to retrieve.
     * @returns A Promise containing a list of role names.
     */
    async getRolesAsync(user: TUser): Promise<string[]> {
        const userRoleStore = this.getUserRoleStore();
        return await userRoleStore.getRolesAsync(user, this.cancellationToken);
    }

    /**
     * Returns a flag indicating whether the specified user is a member of the given named role.
     * @param user The user whose role membership should be checked.
     * @param role The name of the role to be checked.
     * @returns A Promise containing a flag indicating whether the specified user is a member of the named role.
     */
    async isInRoleAsync(user: TUser, role: string): Promise<boolean> {
        const userRoleStore = this.getUserRoleStore();
        return await userRoleStore.isInRoleAsync(user, this.normalizeName(role)!, this.cancellationToken);
    }

    /**
     * Gets the email address for the specified user.
     * @param user The user whose email should be returned.
     * @returns A Promise containing the email address for the specified user.
     */
    async getEmailAsync(user: TUser): Promise<string | null> {
        const store = this.getEmailStore();
        return await store.getEmailAsync(user, this.cancellationToken);
    }

    /**
     * Sets the email address for a user.
     * @param user The user whose email should be set.
     * @param email The email to set.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setEmailAsync(user: TUser, email: string | null): Promise<IdentityResult> {
        const store = this.getEmailStore();
        await store.setEmailAsync(user, email, this.cancellationToken);
        await store.setEmailConfirmedAsync(user, false, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Gets the user, if any, associated with the normalized value of the specified email address.
     * @param email The email address to return the user for.
     * @returns A Promise containing the user, if any, associated with a normalized value of the specified email address.
     */
    async findByEmailAsync(email: string): Promise<TUser | null> {
        const store = this.getEmailStore();
        email = this.normalizeEmail(email)!;
        return await store.findByEmailAsync(email, this.cancellationToken);
    }

        /**
     * Generates an email confirmation token for the specified user.
     * @param user The user to generate an email confirmation token for.
     * @returns A Promise containing an email confirmation token.
     */
    generateEmailConfirmationTokenAsync(user: TUser): Promise<string> {
        return this.generateUserTokenAsync(user, this.options.tokens.emailConfirmationTokenProvider, UserManager.confirmEmailTokenPurpose);
    }

    /**
     * Validates that an email confirmation token matches the specified user.
     * @param user The user to validate the token against.
     * @param token The email confirmation token to validate.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async confirmEmailAsync(user: TUser, token: string): Promise<IdentityResult> {
        return await this.confirmEmailCoreAsync(user, token);
    }

    private async confirmEmailCoreAsync(user: TUser, token: string): Promise<IdentityResult> {
        const store = this.getEmailStore();
        if (!await this.verifyUserTokenAsync(user, this.options.tokens.emailConfirmationTokenProvider, UserManager.confirmEmailTokenPurpose, token)) {
            return IdentityResult.failed(this.errorDescriber.invalidToken());
        }
        await store.setEmailConfirmedAsync(user, true, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Gets a flag indicating whether the email address for the specified user has been verified.
     * @param user The user whose email confirmation status should be returned.
     * @returns A Promise containing true if the email address has been confirmed, otherwise false.
     */
    async isEmailConfirmedAsync(user: TUser): Promise<boolean> {
        const store = this.getEmailStore();
        return await store.getEmailConfirmedAsync(user, this.cancellationToken);
    }

    /**
     * Generates an email change token for the specified user.
     * @param user The user to generate an email change token for.
     * @param newEmail The new email address.
     * @returns A Promise containing an email change token.
     */
    generateChangeEmailTokenAsync(user: TUser, newEmail: string): Promise<string> {
        return this.generateUserTokenAsync(user, this.options.tokens.changeEmailTokenProvider, UserManager.getChangeEmailTokenPurpose(newEmail));
    }

    /**
     * Updates a user's email if the specified email change token is valid for the user.
     * @param user The user whose email should be updated.
     * @param newEmail The new email address.
     * @param token The change email token to be verified.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async changeEmailAsync(user: TUser, newEmail: string, token: string): Promise<IdentityResult> {
        return await this.changeEmailCoreAsync(user, newEmail, token);
    }

    private async changeEmailCoreAsync(user: TUser, newEmail: string, token: string): Promise<IdentityResult> {
        if (!await this.verifyUserTokenAsync(user, this.options.tokens.changeEmailTokenProvider, UserManager.getChangeEmailTokenPurpose(newEmail), token)) {
            return IdentityResult.failed(this.errorDescriber.invalidToken());
        }
        const store = this.getEmailStore();
        await store.setEmailAsync(user, newEmail, this.cancellationToken);
        await store.setEmailConfirmedAsync(user, true, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Gets the telephone number, if any, for the specified user.
     * @param user The user whose telephone number should be retrieved.
     * @returns A Promise containing the user's telephone number, if any.
     */
    async getPhoneNumberAsync(user: TUser): Promise<string | null> {
        const store = this.getPhoneNumberStore();
        return await store.getPhoneNumberAsync(user, this.cancellationToken);
    }

    /**
     * Sets the phone number for the specified user.
     * @param user The user whose phone number to set.
     * @param phoneNumber The phone number to set.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setPhoneNumberAsync(user: TUser, phoneNumber: string | null): Promise<IdentityResult> {
        const store = this.getPhoneNumberStore();
        await store.setPhoneNumberAsync(user, phoneNumber, this.cancellationToken);
        await store.setPhoneNumberConfirmedAsync(user, false, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Sets the phone number for the specified user if the specified change token is valid.
     * @param user The user whose phone number to set.
     * @param phoneNumber The phone number to set.
     * @param token The phone number confirmation token to validate.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async changePhoneNumberAsync(user: TUser, phoneNumber: string, token: string): Promise<IdentityResult> {
        return await this.changePhoneNumberCoreAsync(user, phoneNumber, token);
    }

    private async changePhoneNumberCoreAsync(user: TUser, phoneNumber: string, token: string): Promise<IdentityResult> {
        if (!await this.verifyChangePhoneNumberTokenAsync(user, token, phoneNumber)) {
            return IdentityResult.failed(this.errorDescriber.invalidToken());
        }
        const store = this.getPhoneNumberStore();
        await store.setPhoneNumberAsync(user, phoneNumber, this.cancellationToken);
        await store.setPhoneNumberConfirmedAsync(user, true, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Gets a flag indicating whether the specified user's telephone number has been confirmed.
     * @param user The user to return a flag for.
     * @returns A Promise returning true if the specified user has a confirmed telephone number, otherwise false.
     */
    async isPhoneNumberConfirmedAsync(user: TUser): Promise<boolean> {
        const store = this.getPhoneNumberStore();
        return store.getPhoneNumberConfirmedAsync(user, this.cancellationToken);
    }

    /**
     * Generates a telephone number change token for the specified user.
     * @param user The user to generate a telephone number token for.
     * @param phoneNumber The new phone number the validation token should be sent to.
     * @returns A Promise containing the telephone change number token.
     */
    async generateChangePhoneNumberTokenAsync(user: TUser, phoneNumber: string): Promise<string> {
        return this.generateUserTokenAsync(user, this.options.tokens.changePhoneNumberTokenProvider, UserManager.changePhoneNumberTokenPurpose + ":" + phoneNumber);
    }

    /**
     * Returns a flag indicating whether the specified user's phone number change verification token is valid for the given phoneNumber.
     * @param user The user to validate the token against.
     * @param token The telephone number change token to validate.
     * @param phoneNumber The telephone number the token was generated for.
     * @returns A Promise returning true if the token is valid, otherwise false.
     */
    async verifyChangePhoneNumberTokenAsync(user: TUser, token: string, phoneNumber: string): Promise<boolean> {
        return this.verifyUserTokenAsync(user, this.options.tokens.changePhoneNumberTokenProvider, UserManager.changePhoneNumberTokenPurpose + ":" + phoneNumber, token);
    }

    /**
     * Returns a flag indicating whether the specified token is valid for
     * the given user and purpose.
     * @param user The user to validate the token against.
     * @param tokenProvider The token provider used to generate the token.
     * @param purpose The purpose the token should be generated for.
     * @param token The token to validate.
     * @returns A Promise returning true if the token is valid, otherwise false.
     */
    async verifyUserTokenAsync(user: TUser, tokenProvider: string, purpose: string, token: string): Promise<boolean> {
        const provider = this._tokenProviders.get(tokenProvider);
        if (!provider) {
            throw new Error(`No token provider for ${tokenProvider}`);
        }
        const result = await provider.validateAsync(purpose, token, this as any, user);
        return result;
    }

    /**
     * Generates a token for the given user and purpose.
     * @param user The user the token will be for.
     * @param tokenProvider The provider which will generate the token.
     * @param purpose The purpose the token will be for.
     * @returns A Promise containing a token for the given user and purpose.
     */
    async generateUserTokenAsync(user: TUser, tokenProvider: string, purpose: string): Promise<string> {
        const provider = this._tokenProviders.get(tokenProvider);
        if (!provider) {
            throw new Error(`No token provider for ${tokenProvider}`);
        }
        return provider.generateAsync(purpose, this as any, user);
    }

    /**
     * Registers a token provider.
     * @param providerName The name of the provider to register.
     * @param provider The provider to register.
     */
    registerTokenProvider(providerName: string, provider: IUserTwoFactorTokenProvider<TKey, TUser>): void {
        this._tokenProviders.set(providerName, provider);
    }

    /**
     * Gets a list of valid two factor token providers for the specified user.
     * @param user The user whose two factor authentication providers will be returned.
     * @returns A Promise containing a list of two factor authentication providers for the specified user.
     */
    async getValidTwoFactorProvidersAsync(user: TUser): Promise<string[]> {
        const results: string[] = [];
        for (const [key, provider] of this._tokenProviders) {
            if (await provider.canGenerateTwoFactorTokenAsync(this, user)) {
                results.push(key);
            }
        }
        return results;
    }

    /**
     * Verifies the specified two factor authentication token against the user.
     * @param user The user the token is supposed to be for.
     * @param tokenProvider The provider which will verify the token.
     * @param token The token to verify.
     * @returns A Promise returning true if the token is valid, otherwise false.
     */
    async verifyTwoFactorTokenAsync(user: TUser, tokenProvider: string, token: string): Promise<boolean> {
        const provider = this._tokenProviders.get(tokenProvider);
        if (!provider) {
            throw new Error(`No token provider for ${tokenProvider}`);
        }
        const result = await provider.validateAsync("TwoFactor", token, this as any, user);
        return result;
    }

    /**
     * Gets a two factor authentication token for the specified user.
     * @param user The user the token is for.
     * @param tokenProvider The provider which will generate the token.
     * @returns A Promise containing a two factor authentication token for the user.
     */
    async generateTwoFactorTokenAsync(user: TUser, tokenProvider: string): Promise<string> {
        const provider = this._tokenProviders.get(tokenProvider);
        if (!provider) {
            throw new Error(`No token provider for ${tokenProvider}`);
        }
        return provider.generateAsync("TwoFactor", this as any, user);
    }

    /**
     * Returns a flag indicating whether the specified user has two factor authentication enabled or not.
     * @param user The user whose two factor authentication enabled status should be retrieved.
     * @returns A Promise returning true if the specified user has two factor authentication enabled, otherwise false.
     */
    async getTwoFactorEnabledAsync(user: TUser): Promise<boolean> {
        const store = this.getUserTwoFactorStore();
        return await store.getTwoFactorEnabledAsync(user, this.cancellationToken);
    }

    /**
     * Sets a flag indicating whether the specified user has two factor authentication enabled or not.
     * @param user The user whose two factor authentication enabled status should be set.
     * @param enabled A flag indicating whether the specified user has two factor authentication enabled.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setTwoFactorEnabledAsync(user: TUser, enabled: boolean): Promise<IdentityResult> {
        const store = this.getUserTwoFactorStore();
        await store.setTwoFactorEnabledAsync(user, enabled, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

        /**
     * Returns a flag indicating whether the specified user is locked out.
     * @param user The user whose locked out status should be retrieved.
     * @returns A Promise returning true if the specified user is locked out, otherwise false.
     */
    async isLockedOutAsync(user: TUser): Promise<boolean> {
        const store = this.getUserLockoutStore();
        if (!await store.getLockoutEnabledAsync(user, this.cancellationToken)) {
            return false;
        }
        const lockoutTime = await store.getLockoutEndDateAsync(user, this.cancellationToken);
        return lockoutTime != null && lockoutTime >= this.utcNow();
    }

    /**
     * Sets a flag indicating whether the specified user can be locked out.
     * @param user The user whose locked out status should be set.
     * @param enabled Flag indicating whether the user can be locked out or not.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setLockoutEnabledAsync(user: TUser, enabled: boolean): Promise<IdentityResult> {
        const store = this.getUserLockoutStore();
        await store.setLockoutEnabledAsync(user, enabled, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Retrieves a flag indicating whether user lockout can be enabled for the specified user.
     * @param user The user whose ability to be locked out should be returned.
     * @returns A Promise returning true if a user can be locked out, otherwise false.
     */
    async getLockoutEnabledAsync(user: TUser): Promise<boolean> {
        const store = this.getUserLockoutStore();
        return await store.getLockoutEnabledAsync(user, this.cancellationToken);
    }

    /**
     * Gets the last DateTimeOffset a user's last lockout expired, if any.
     * A time value in the past indicates a user is not currently locked out.
     * @param user The user whose lockout date should be retrieved.
     * @returns A Promise containing the last time a user's lockout expired, if any.
     */
    async getLockoutEndDateAsync(user: TUser): Promise<Date | null> {
        const store = this.getUserLockoutStore();
        return await store.getLockoutEndDateAsync(user, this.cancellationToken);
    }

    /**
     * Locks out a user until the specified end date has passed.
     * @param user The user whose lockout date should be set.
     * @param lockoutEnd The Date after which the user's lockout should end.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setLockoutEndDateAsync(user: TUser, lockoutEnd: Date | null): Promise<IdentityResult> {
        return await this.setLockoutEndDateCoreAsync(user, lockoutEnd);
    }

    private async setLockoutEndDateCoreAsync(user: TUser, lockoutEnd: Date | null): Promise<IdentityResult> {
        const store = this.getUserLockoutStore();
        if (!await store.getLockoutEnabledAsync(user, this.cancellationToken)) {
            return IdentityResult.failed(this.errorDescriber.userLockoutNotEnabled());
        }
        await store.setLockoutEndDateAsync(user, lockoutEnd, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Increments the access failed count for the user.
     * If the failed access count is greater than or equal to the configured maximum number of attempts,
     * the user will be locked out for the configured lockout time span.
     * @param user The user whose failed access count to increment.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async accessFailedAsync(user: TUser): Promise<IdentityResult> {
        const store = this.getUserLockoutStore();
        const count = await store.incrementAccessFailedCountAsync(user, this.cancellationToken);
        if (count < this.options.lockout.maxFailedAccessAttempts) {
            return await this.updateUserAsync(user);
        }
        const lockoutEndDate = this.utcNow();
        lockoutEndDate.setMinutes(this.utcNow().getMinutes() + this.options.lockout.defaultLockoutTimeSpan);
        await store.setLockoutEndDateAsync(user, lockoutEndDate, this.cancellationToken);
        await store.resetAccessFailedCountAsync(user, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Resets the access failed count for the specified user.
     * @param user The user whose failed access count should be reset.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async resetAccessFailedCountAsync(user: TUser): Promise<IdentityResult> {
        return await this.resetAccessFailedCountCoreAsync(user);
    }

    private async resetAccessFailedCountCoreAsync(user: TUser): Promise<IdentityResult> {
        const store = this.getUserLockoutStore();
        if (await this.getAccessFailedCountAsync(user) === 0) {
            return IdentityResult.success();
        }
        await store.resetAccessFailedCountAsync(user, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Retrieves the current number of failed accesses for the given user.
     * @param user The user whose access failed count should be retrieved.
     * @returns A Promise containing the current failed access count for the user.
     */
    async getAccessFailedCountAsync(user: TUser): Promise<number> {
        const store = this.getUserLockoutStore();
        return await store.getAccessFailedCountAsync(user, this.cancellationToken);
    }

    /**
     * Returns a list of users from the user store who have the specified claim.
     * @param claim The claim to look for.
     * @returns A Promise containing a list of users who have the specified claim.
     */
    async getUsersForClaimAsync(claim: Claim): Promise<TUser[]> {
        const store = this.getClaimStore();
        return store.getUsersForClaimAsync(claim, this.cancellationToken);
    }

    /**
     * Returns a list of users from the user store who are members of the specified roleName.
     * @param roleName The name of the role whose users should be returned.
     * @returns A Promise containing a list of users who are members of the specified role.
     */
    async getUsersInRoleAsync(roleName: string): Promise<TUser[]> {
        const store = this.getUserRoleStore();
        return store.getUsersInRoleAsync(this.normalizeName(roleName)!, this.cancellationToken);
    }

    /**
     * Returns an authentication token for a user.
     * @param user The user.
     * @param loginProvider The authentication scheme for the provider the token is associated with.
     * @param tokenName The name of the token.
     * @returns A Promise containing the authentication token for a user.
     */
    async getAuthenticationTokenAsync(user: TUser, loginProvider: string, tokenName: string): Promise<string | null> {
        const store = this.getAuthenticationTokenStore();
        return store.getTokenAsync(user, loginProvider, tokenName, this.cancellationToken);
    }

    /**
     * Sets an authentication token for a user.
     * @param user The user.
     * @param loginProvider The authentication scheme for the provider the token is associated with.
     * @param tokenName The name of the token.
     * @param tokenValue The value of the token.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async setAuthenticationTokenAsync(user: TUser, loginProvider: string, tokenName: string, tokenValue: string | null): Promise<IdentityResult> {
        const store = this.getAuthenticationTokenStore();
        await store.setTokenAsync(user, loginProvider, tokenName, tokenValue, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Remove an authentication token for a user.
     * @param user The user.
     * @param loginProvider The authentication scheme for the provider the token is associated with.
     * @param tokenName The name of the token.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async removeAuthenticationTokenAsync(user: TUser, loginProvider: string, tokenName: string): Promise<IdentityResult> {
        const store = this.getAuthenticationTokenStore();
        await store.removeTokenAsync(user, loginProvider, tokenName, this.cancellationToken);
        return await this.updateUserAsync(user);
    }

    /**
     * Returns the authenticator key for the user.
     * @param user The user.
     * @returns A Promise containing the authenticator key.
     */
    async getAuthenticatorKeyAsync(user: TUser): Promise<string | null> {
        const store = this.getAuthenticatorKeyStore();
        return store.getAuthenticatorKeyAsync(user, this.cancellationToken);
    }

    /**
     * Resets the authenticator key for the user.
     * @param user The user.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async resetAuthenticatorKeyAsync(user: TUser): Promise<IdentityResult> {
        const store = this.getAuthenticatorKeyStore();
        await store.setAuthenticatorKeyAsync(user, this.generateNewAuthenticatorKey(), this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return await this.updateUserAsync(user);
    }

    /**
     * Generates a new base32 encoded 160-bit security secret.
     * @returns The new security secret.
     */
    generateNewAuthenticatorKey(): string {
        return UserManager.newSecurityStamp();
    }

    /**
     * Generates recovery codes for the user, invalidating any previous recovery codes.
     * @param user The user to generate recovery codes for.
     * @param number The number of codes to generate.
     * @returns A Promise containing the new recovery codes for the user.
     */
    async generateNewTwoFactorRecoveryCodesAsync(user: TUser, number: number): Promise<string[] | null> {
        const store = this.getRecoveryCodeStore();
        const newCodes: string[] = [];
        for (let i = 0; i < number; i++) {
            newCodes.push(this.createTwoFactorRecoveryCode());
        }
        await store.replaceCodesAsync(user, [...new Set(newCodes)], this.cancellationToken);
        const update = await this.updateUserAsync(user);
        return update.succeeded ? newCodes : null;
    }

    /**
     * Generate a new recovery code.
     * @returns A recovery code string.
     */
    protected createTwoFactorRecoveryCode(): string {
        const chars = UserManager.allowedChars;
        const code = [
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            '-',
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)],
            chars[Math.floor(Math.random() * chars.length)]
        ];
        return code.join('');
    }

    private static readonly allowedChars: string[] = "23456789BCDFGHJKMNPQRTVWXY".split('');

    /**
     * Returns whether a recovery code is valid for a user.
     * @param user The user who owns the recovery code.
     * @param code The recovery code to use.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    async redeemTwoFactorRecoveryCodeAsync(user: TUser, code: string): Promise<IdentityResult> {
        return await this.redeemTwoFactorRecoveryCodeCoreAsync(user, code);
    }

    private async redeemTwoFactorRecoveryCodeCoreAsync(user: TUser, code: string): Promise<IdentityResult> {
        const store = this.getRecoveryCodeStore();
        const success = await store.redeemCodeAsync(user, code, this.cancellationToken);
        if (success) {
            return await this.updateUserAsync(user);
        }
        return IdentityResult.failed(this.errorDescriber.recoveryCodeRedemptionFailed());
    }

    /**
     * Returns how many recovery codes are still valid for a user.
     * @param user The user.
     * @returns A Promise containing the number of valid recovery codes.
     */
    async countRecoveryCodesAsync(user: TUser): Promise<number> {
        const store = this.getRecoveryCodeStore();
        return store.countCodesAsync(user, this.cancellationToken);
    }

    /**
     * Returns the current UTC time.
     * @returns The current UTC time.
     */
    private utcNow(): Date {
        return new Date();
    }

    /**
     * Creates bytes to use as a security token from the user's security stamp.
     * @param user The user.
     * @returns A Promise containing the security token bytes.
     */
    async createSecurityTokenAsync(user: TUser): Promise<Uint8Array> {
        const stamp = await this.getSecurityStampAsync(user);
        return new TextEncoder().encode(stamp);
    }

    private async updateSecurityStampInternal(user: TUser): Promise<void> {
        if (this.supportsUserSecurityStamp) {
            await this.getSecurityStore().setSecurityStampAsync(user, UserManager.newSecurityStamp(), this.cancellationToken);
        }
    }

    /**
     * Updates a user's password hash.
     * @param user The user.
     * @param newPassword The new password.
     * @param validatePassword Whether to validate the password.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    protected updatePasswordHash(user: TUser, newPassword: string, validatePassword: boolean): Promise<IdentityResult> {
        return this.updatePasswordHashCore(this.getPasswordStore(), user, newPassword, validatePassword);
    }

    private async updatePasswordHashCore(passwordStore: IUserPasswordStore<TKey, TUser>, user: TUser, newPassword: string | null, validatePassword: boolean = true): Promise<IdentityResult> {
        if (validatePassword) {
            const validate = await this.validatePasswordAsync(user, newPassword);
            if (!validate.succeeded) {
                return validate;
            }
        }
        const hash = newPassword != null ? this.passwordHasher.hashPassword(user, newPassword) : null;
        await passwordStore.setPasswordHashAsync(user, hash, this.cancellationToken);
        await this.updateSecurityStampInternal(user);
        return IdentityResult.success();
    }

    private static newSecurityStamp(): string {
        return generateBase32();
    }

    /**
     * Generates the token purpose used to change email.
     * @param newEmail The new email address.
     * @returns The token purpose.
     */
    public static getChangeEmailTokenPurpose(newEmail: string): string {
        return "ChangeEmail:" + newEmail;
    }

    /**
     * Should return IdentityResult.success if validation is successful.
     * Called before saving the user via Create or Update.
     * @param user The user.
     * @returns A Promise containing the IdentityResult of the validation.
     */
    protected async validateUserAsync(user: TUser): Promise<IdentityResult> {
        if (this.supportsUserSecurityStamp) {
            const stamp = await this.getSecurityStampAsync(user);
            if (stamp == null) {
                throw new Error("Null security stamp");
            }
        }
        let errors: IdentityError[] | null = null;
        for (const v of this.userValidators) {
            const result = await v.validateAsync(this as any, user);
            if (!result.succeeded) {
                errors ??= [];
                errors.push(...result.errors);
            }
        }
        if (errors && errors.length > 0) {
            return IdentityResult.failed(errors);
        }
        return IdentityResult.success();
    }

    /**
     * Should return IdentityResult.success if validation is successful.
     * Called before updating the password hash.
     * @param user The user.
     * @param password The password.
     * @returns A Promise containing the IdentityResult of the validation.
     */
    protected async validatePasswordAsync(user: TUser, password: string | null): Promise<IdentityResult> {
        let errors: IdentityError[] | null = null;
        let isValid = true;
        for (const v of this.passwordValidators) {
            const result = await v.validateAsync(this as any, user, password);
            if (!result.succeeded) {
                if (result.errors.length > 0) {
                    errors ??= [];
                    errors.push(...result.errors);
                }
                isValid = false;
            }
        }
        if (!isValid) {
            return IdentityResult.failed(errors ?? []);
        }
        return IdentityResult.success();
    }

    /**
     * Called to update the user after validating and updating the normalized email/user name.
     * @param user The user.
     * @returns A Promise containing the IdentityResult of the operation.
     */
    protected async updateUserAsync(user: TUser): Promise<IdentityResult> {
        const result = await this.validateUserAsync(user);
        if (!result.succeeded) {
            return result;
        }
        return await this.store.updateAsync(user, this.cancellationToken);
    }


    // private getUserTwoFactorStore(): IUserTwoFactorStore<TUser> {
    //     const cast = this.store as IUserTwoFactorStore<TUser>;
    //     if (!cast) throw new Error("Store does not implement IUserTwoFactorStore");
    //     return cast;
    // }

    // private getUserLockoutStore(): IUserLockoutStore<TUser> {
    //     const cast = this.store as IUserLockoutStore<TUser>;
    //     if (!cast) throw new Error("Store does not implement IUserLockoutStore");
    //     return cast;
    // }

    // private getEmailStore(): IUserEmailStore<TKey, TUser> {
    //     const cast = this.store as IUserEmailStore<TKey, TUser>;
    //     if (!cast) throw new Error("Store does not implement IUserEmailStore");
    //     return cast;
    // }

    // private getOptionalEmailStore(): IUserEmailStore<TKey, TUser> | null {
    //     return this.store as IUserEmailStore<TKey, TUser>;
    // }

    // private getPhoneNumberStore(): IUserPhoneNumberStore<TUser> {
    //     const cast = this.store as IUserPhoneNumberStore<TUser>;
    //     if (!cast) throw new Error("Store does not implement IUserPhoneNumberStore");
    //     return cast;
    // }

    // private getUserRoleStore(): IUserRoleStore<TUser> {
    //     const cast = this.store as IUserRoleStore<TUser>;
    //     if (!cast) {
    //         throw new Error("Store does not implement IUserRoleStore");
    //     }
    //     return cast;
    // }
    
    // private getLoginStore(): IUserLoginStore<TUser> {
    //     const cast = this.store as IUserLoginStore<TUser>;
    //     if (!cast) {
    //         throw new Error("Store does not implement IUserLoginStore");
    //     }
    //     return cast;
    // }

    // private getSecurityStore(): IUserSecurityStampStore<TUser> {
    //     const cast = this.store as IUserSecurityStampStore<TUser>;
    //     if (!cast) {
    //         throw new Error("Store does not implement IUserSecurityStampStore");
    //     }
    //     return cast;
    // }

    // private getClaimStore(): IUserClaimStore<TUser> {
    //     const cast = this.store as IUserClaimStore<TUser>;
    //     if (!cast) {
    //         throw new Error("Store does not implement IUserClaimStore");
    //     }
    //     return cast;
    // }

    private getUserTwoFactorStore(): IUserTwoFactorStore<TUser> {
        const cast = this.store as IUserTwoFactorStore<TUser>;
        const defaultInstance = new DefaultUserTwoFactorStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserTwoFactorStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getUserLockoutStore(): IUserLockoutStore<TUser> {
        const cast = this.store as IUserLockoutStore<TUser>;
        const defaultInstance = new DefaultUserLockoutStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserLockoutStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getEmailStore(): IUserEmailStore<TKey, TUser> {
        const cast = this.store as IUserEmailStore<TKey, TUser>;
        const defaultInstance = new DefaultUserEmailStore<TKey, TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserEmailStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getOptionalEmailStore(): IUserEmailStore<TKey, TUser> | null {
    // Optional: return null if not fully implemented
        const cast = this.store as IUserEmailStore<TKey, TUser>;
        const defaultInstance = new DefaultUserEmailStore<TKey, TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
                return null;
            }
        }
        return cast;
    }

    private getPhoneNumberStore(): IUserPhoneNumberStore<TUser> {
        const cast = this.store as IUserPhoneNumberStore<TUser>;
        const defaultInstance = new DefaultUserPhoneNumberStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserPhoneNumberStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getUserRoleStore(): IUserRoleStore<TUser> {
        const cast = this.store as IUserRoleStore<TUser>;
        const defaultInstance = new DefaultUserRoleStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserRoleStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getLoginStore(): IUserLoginStore<TUser> {
        const cast = this.store as IUserLoginStore<TUser>;
        const defaultInstance = new DefaultUserLoginStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserLoginStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getSecurityStore(): IUserSecurityStampStore<TUser> {
        const cast = this.store as IUserSecurityStampStore<TUser>;
        const defaultInstance = new DefaultUserSecurityStampStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserSecurityStampStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getClaimStore(): IUserClaimStore<TUser> {
        const cast = this.store as IUserClaimStore<TUser>;
        const defaultInstance = new DefaultUserClaimStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserClaimStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getAuthenticatorKeyStore(): IUserAuthenticatorKeyStore<TUser> {
        const cast = this.store as IUserAuthenticatorKeyStore<TUser>;
        const defaultInstance = new DefaultAuthenticatorKeyStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserAuthenticatorKeyStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getAuthenticationTokenStore(): IUserAuthenticationTokenStore<TKey, TUser> {
        const cast = this.store as IUserAuthenticationTokenStore<TKey, TUser>;
        const defaultInstance = new DefaultUserAuthenticationTokenStore<TKey, TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserAuthenticationTokenStore: missing ${key}`);
            }
        }
        return cast;
    }

    private getRecoveryCodeStore(): IUserTwoFactorRecoveryCodeStore<TUser> {
        const cast = this.store as IUserTwoFactorRecoveryCodeStore<TUser>;
        const defaultInstance = new DefaultTwoFactorRecoveryCodeStore<TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserTwoFactorRecoveryCodeStore: missing ${key}`);
            }
        }
        return cast;
    }


    private getPasswordStore(): IUserPasswordStore<TKey, TUser> {
        const cast = this.store as IUserPasswordStore<TKey, TUser>;
        const defaultInstance = new DefaultUserPasswordStore<TKey, TUser>();

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(defaultInstance))) {
            if (key !== "constructor" && typeof (cast as any)[key] !== "function") {
            throw new Error(`Store does not implement IUserPasswordStore: missing ${key}`);
            }
        }
        return cast;
    }

    /**
     * Throws if this class has been disposed.
     */
    protected throwIfDisposed(): void {
        if (this._disposed) {
            throw new Error("Object disposed");
        }
    }

}