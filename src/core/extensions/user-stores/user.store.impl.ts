// user.store.impl.ts

import { Claim } from "../../../claims/claim.js";
import { AllowedPrimaryKeysSafe, DbContext, DbSet } from "../../../contexts/index.js";
import { IQueryable } from "../../../linq/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { ArgumentException, ArgumentNullException, ArgumentNullThrowHelper } from "../../../types/exception.js";
import { randomUUID } from "../../../utils.js";
import { IdentityErrorDescriber, IdentityResult } from "../../identity/index.js";
import {
  IdentityRole,
  IdentityRoleClaim,
  IdentityUser,
  IdentityUserClaim,
  IdentityUserLogin,
  IdentityUserRole,
  IdentityUserToken,
  UserLoginInfo,
} from "../../types/index.js";
import { IUserAuthenticatorKeyStore } from "./user.authentication.key.store.js";
import { IUserAuthenticationTokenStore } from "./user.authentication.token.store.js";
import { IUserClaimStore } from "./user.claim.store.js";
import { IUserEmailStore } from "./user.email.store.js";
import { IUserLockoutStore } from "./user.lockout.store.js";
import { IUserLoginStore } from "./user.login.store.js";
import { IUserPasswordStore } from "./user.password.store.js";
import { IUserPhoneNumberStore } from "./user.phone.store.js";
import { IUserRoleStore } from "./user.role.store.js";
import { IUserSecurityStampStore } from "./user.security.stamp.store.js";
import { UserStoreBase1 } from "./user.store.base.1.js";
import { IProtectedUserStore } from "./user.store.js";
import { IUserTwoFactorRecoveryCodeStore } from "./user.two_factor.recovery.code.store.js";
import { IUserTwoFactorStore } from "./user.two_factor.store.js";

export class UserStore<
  TUser extends IdentityUser<TKey>,
  TRole extends IdentityRole<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TContext   extends DbContext,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,
> extends UserStoreBase1<
  TUser,
  TRole,
  TKey,
  TUserClaim,
  TUserRole,
  TUserLogin,
  TUserToken,
  TRoleClaim
> implements 
    IProtectedUserStore<TUser>,
    IUserAuthenticatorKeyStore<TUser>,
    IUserAuthenticationTokenStore<TKey, TUser>, 
    IUserClaimStore<TUser>, 
    IUserEmailStore<TKey, TUser>,
    IUserLockoutStore<TUser>, 
    IUserLoginStore<TUser>, 
    IUserPasswordStore<TKey, TUser>, 
    IUserPhoneNumberStore<TUser>, 
    IUserRoleStore<TUser>, 
    IUserSecurityStampStore<TUser>, 
    IUserTwoFactorRecoveryCodeStore<TUser>, 
    IUserTwoFactorStore<TUser>
{

    /// <summary>
    /// Constructs a new instance of UserStore.
    /// </summary>
    constructor(
        protected readonly context: TContext, 
        private readonly ctorUser: new () => TUser,
        private readonly ctorRole: new () => TRole,
        private readonly ctorUserClaim: new () => IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
        private readonly ctorUserRole : new () => IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
        private readonly ctorUserLogin: new () => IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
        private readonly ctorUserToken: new () => IdentityUserToken<TKey> = IdentityUserToken<TKey>,
        private readonly ctorRoleClaim: new () => IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,

        describer?: IdentityErrorDescriber | null) {
        ArgumentNullThrowHelper.throwIfNull(context);

        super(describer ?? new IdentityErrorDescriber());
    }

    /// <summary>
    /// DbSets for identity entities, retrieved from the context.
    /// </summary>
    public get usersSet(): DbSet<TUser> {
        return this.context.set<TUser>(this.ctorUser);
    }

    public get roles(): DbSet<TRole> {
        return this.context.set<TRole>(this.ctorRole);
    }

    public get userClaims(): DbSet<IdentityUserClaim<TKey>> {
        return this.context.set<IdentityUserClaim<TKey>>(this.ctorUserClaim);
    }

    public get userRoles(): DbSet<IdentityUserRole<TKey>> {
        return this.context.set<IdentityUserRole<TKey>>(this.ctorUserRole);
    }

    public get userLogins(): DbSet<IdentityUserLogin<TKey>> {
        return this.context.set<IdentityUserLogin<TKey>>(this.ctorUserLogin);
    }

    public get userTokens(): DbSet<IdentityUserToken<TKey>> {
        return this.context.set<IdentityUserToken<TKey>>(this.ctorUserToken);
    }

    /// <summary>
    /// A navigation property for the users the store contains.
    /// </summary>
    public override get users(): IQueryable<TUser> {
        return this.usersSet;
    }

    /// <summary>
    /// Gets or sets a flag indicating if changes should be persisted after CreateAsync, UpdateAsync and DeleteAsync are called.
    /// </summary>
    public autoSaveChanges: boolean = true;

    /// <summary>
    /// Saves the current store.
    /// </summary>
    protected async saveChanges(cancellationToken: CancellationToken): Promise<void> {
        return this.autoSaveChanges ? this.context.saveChangesAsync(cancellationToken) : Promise.resolve()
    }

    //#region Users
    /// <summary>
    /// Creates the specified user in the user store.
    /// </summary>
    public override async createAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<IdentityResult> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        this.context.add(user);
        await this.saveChanges(cancellationToken);
        return IdentityResult.success();
    }

    /// <summary>
    /// Updates the specified user in the user store.
    /// </summary>
    public override async updateAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<IdentityResult> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        this.context.attach(user);
        user.concurrencyStamp = randomUUID();
        this.context.update(user);

        try {
            await this.saveChanges(cancellationToken);
        } catch (e) {
            return IdentityResult.failed(this.errorDescriber.concurrencyFailure());
        }
        return IdentityResult.success();
    }

    /// <summary>
    /// Deletes the specified user from the user store.
    /// </summary>
    public override async deleteAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<IdentityResult> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        this.context.remove(user);

        try {
            await this.saveChanges(cancellationToken);
        } catch (e) {
            return IdentityResult.failed(this.errorDescriber.concurrencyFailure());
        }
        return IdentityResult.success();
    }

    /// <summary>
    /// Finds and returns a user, if any, who has the specified userId.
    /// </summary>
    public override async findByIdAsync(userId: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();

        const id = this.convertIdFromString(userId);
        return this.usersSet.find(u => {
            console.log("USER ", id, u)

            return u.id === id
        }) ?? null;
    }

    /// <summary>
    /// Finds and returns a user, if any, who has the specified normalized user name.
    /// </summary>
    public override async findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();

        return this.users
            .firstOrDefault(u => u.normalizedUserName === normalizedUserName) ?? null;
    }

    /// <summary>
    /// Gets the user, if any, associated with the specified normalized email address.
    /// </summary>
    public override async findByEmailAsync(normalizedEmail: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();

        return this.users
            .singleOrDefault(u => u.normalizedEmail === normalizedEmail) ?? null;
    }

    /// <summary>
    /// Return a user with the matching userId if it exists.
    /// </summary>
    protected override async findUserAsync(userId: TKey, cancellationToken: CancellationToken): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();

        return this.users.singleOrDefault(u => u.id === userId) ?? null;
    }

    /// <summary>
    /// Retrieves the user associated with the specified login provider and login provider key.
    /// </summary>
    public override async findByLoginAsync(loginProvider: string, providerKey: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        const userLogin = await this.findUserLoginAsync(loginProvider, providerKey, cancellationToken);
        if (userLogin != null) {
            return await this.findUserAsync(userLogin.userId, cancellationToken);
        }
        return null;
    }
    //#endregion

    //#region Roles
    /// <summary>
    /// Retrieves all users in the specified role.
    /// </summary>
    public override async getUsersInRoleAsync(normalizedRoleName: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser[]> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentException.throwIfNullOrEmpty(normalizedRoleName);

        const role = await this.findRoleAsync(normalizedRoleName, cancellationToken);

        if (role != null) {
            return this.userRoles
                .where(ur => ur.roleId === role.id)
                .select(ur => this.usersSet.firstOrDefault(u => u.id === ur.userId)!)
                .where(u => u != null)
                .toArray();
        }
        return [];
    }
    
    /// <summary>
    /// Adds the given normalizedRoleName to the specified user.
    /// </summary>
    public override async addToRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentException.throwIfNullOrWhiteSpace(normalizedRoleName);

        const roleEntity = await this.findRoleAsync(normalizedRoleName, cancellationToken);

        if (roleEntity == null) {
            throw new Error(`Role not found: ${normalizedRoleName}`);
        }

        this.userRoles.add(this.createUserRole(IdentityUserRole as new () => TUserRole, user, roleEntity));
        await this.saveChanges(cancellationToken);
    }

    /// <summary>
    /// Removes the given normalizedRoleName from the specified user.
    /// </summary>
    public override async removeFromRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentException.throwIfNullOrWhiteSpace(normalizedRoleName);

        const roleEntity = await this.findRoleAsync(normalizedRoleName, cancellationToken);
        
        if (roleEntity != null) {
            const userRole = await this.findUserRoleAsync(user.id, roleEntity.id, cancellationToken);
            if (userRole != null) {
                this.userRoles.remove(userRole);
                await this.saveChanges(cancellationToken);
            }
        }
    }

      /// <summary>
    /// Retrieves the roles the specified user is a member of.
    /// </summary>
    public override async getRolesAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string[]> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        return this.userRoles
            .where(ur => ur.userId === user.id)
            .select(ur => this.roles.firstOrDefault(r => r.id === ur.roleId)?.name ?? null)
            .where(name => name != null)
            .toArray() as string[];
    }

    /// <summary>
    /// Returns a flag indicating if the specified user is a member of the given normalizedRoleName.
    /// </summary>
    public override async isInRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentException.throwIfNullOrWhiteSpace(normalizedRoleName);

        const role = await this.findRoleAsync(normalizedRoleName, cancellationToken);
        if (role != null) {
            const userRole = await this.findUserRoleAsync(user.id, role.id, cancellationToken);
            return Promise.resolve(userRole != null);
        }
        return Promise.resolve(false);
    }

    /// <summary>
    /// Return a role with the normalized name if it exists.
    /// </summary>
    protected override async findRoleAsync(normalizedRoleName: string, cancellationToken: CancellationToken): Promise<TRole | null> {
        cancellationToken.throwIfCancellationRequested();
        return this.roles.find(r => r.normalizedName === normalizedRoleName) ?? null;
    }

    /// <summary>
    /// Return a user role for the userId and roleId if it exists.
    /// </summary>
    protected override async findUserRoleAsync(userId: TKey, roleId: TKey, cancellationToken: CancellationToken): Promise<TUserRole | null> {
        cancellationToken.throwIfCancellationRequested();
        return (this.userRoles.find(ur => ur.userId === userId && ur.roleId === roleId) as TUserRole) ?? null;
    }
    //#endregion

    /// <summary>
    /// Return a user login with the matching userId, provider, providerKey if it exists.
    /// </summary>
    protected override async findUserLoginAsync(arg1: TKey | string, arg2: string, arg3: string | CancellationToken, arg4?: CancellationToken): Promise<TUserLogin | null> {
        if (!(arg3 instanceof CancellationToken)) {
            // This is the overload with userId
            const userId = arg1;
            const loginProvider = arg2;
            const providerKey = arg3 as string;
            const cancellationToken = arg4 ?? CancellationToken.none;
            cancellationToken.throwIfCancellationRequested();
            // Implementation for userId + provider
            return (this.userLogins.find(
                    l => l.userId === userId && l.loginProvider === loginProvider && l.providerKey === providerKey
                ) as TUserLogin) ?? null;
        } else {
            // This is the overload without userId
            const loginProvider = arg1 as string;
            const providerKey = arg2;
            const cancellationToken = arg3 as CancellationToken;
            cancellationToken.throwIfCancellationRequested();
            // Implementation for provider only
            return (this.userLogins.find(
                    l => l.loginProvider === loginProvider && l.providerKey === providerKey
                ) as TUserLogin) ?? null;
        }
    }

    /// <summary>
    /// Return a user login with provider, providerKey if it exists.
    /// </summary>
    protected async findUserLoginByProviderAsync(loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<IdentityUserLogin<TKey> | null> {
        cancellationToken.throwIfCancellationRequested();
        return this.userLogins.find(userLogin =>
            userLogin.loginProvider === loginProvider &&
            userLogin.providerKey === providerKey
        ) ?? null;
    }

    //#region Claims
    /// <summary>
    /// Get the claims associated with the specified user as an asynchronous operation.
    /// </summary>
    public override async getClaimsAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<Claim[]> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        const userClaims = this.userClaims
            .where(uc => uc.userId === user.id)
            .select(uc => uc.toClaim())
            .toArray();

      return userClaims

    }

    /// <summary>
    /// Adds the claims given to the specified user.
    /// </summary>
    public override async addClaimsAsync(user: TUser, claims: Claim[], cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentNullException.throwIfNull(claims);

        for (const claim of claims) {
            this.userClaims.add(this.createUserClaim(IdentityUserClaim as new () => TUserClaim, user, claim));
        }
        await this.saveChanges(cancellationToken);
    }

    /// <summary>
    /// Replaces the claim on the specified user, with the newClaim.
    /// </summary>
    public override async replaceClaimAsync(user: TUser, claim: Claim, newClaim: Claim, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentNullException.throwIfNull(claim);
        ArgumentNullException.throwIfNull(newClaim);

        const matchedClaims = this.userClaims
            .asQueryable()
            .where(uc =>
                uc.userId === user.id &&
                uc.claimValue === claim.value &&
                uc.claimType === claim.type
            )
            .toArray();

        for (const matchedClaim of matchedClaims) {
            matchedClaim.claimValue = newClaim.value;
            matchedClaim.claimType = newClaim.type;
            this.userClaims.update(matchedClaim);
        }
        await this.saveChanges(cancellationToken);
    }

    /// <summary>
    /// Removes the claims given from the specified user.
    /// </summary>
    public override async removeClaimsAsync(user: TUser, claims: Claim[], cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentNullException.throwIfNull(claims);

        for (const claim of claims) {
            const matchedClaims = this.userClaims
                .asQueryable()
                .where(uc =>
                    uc.userId === user.id &&
                    uc.claimValue === claim.value &&
                    uc.claimType === claim.type
                )
                .toArray();

            for (const c of matchedClaims) {
                this.userClaims.remove(c);
            }
        }
        await this.saveChanges(cancellationToken);
    }

    /// <summary>
    /// Retrieves all users with the specified claim.
    /// </summary>
    public override async getUsersForClaimAsync(claim: Claim, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser[]> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(claim);

        return this.userClaims
            .where(uc => uc.claimValue === claim.value && uc.claimType === claim.type)
            .select(uc => this.usersSet.firstOrDefault(u => u.id === uc.userId)!)
            .where(u => u != null)
            .toArray();
    }
    //#endregion

    //#region UserLogins
    /// <summary>
    /// Adds the login given to the specified user.
    /// </summary>
    public override async addLoginAsync(user: TUser, login: UserLoginInfo, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);
        ArgumentNullException.throwIfNull(login);

        this.userLogins.add(this.createUserLogin(IdentityUserLogin as new () => TUserLogin, user, login));
        await this.saveChanges(cancellationToken);
    }

    /// <summary>
    /// Removes the loginProvider given from the specified user.
    /// </summary>
    public override async removeLoginAsync(user: TUser, loginProvider: string, providerKey: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        const entry = await this.findUserLoginAsync(user.id, loginProvider, providerKey, cancellationToken);
        if (entry != null) {
            this.userLogins.remove(entry);
            await this.saveChanges(cancellationToken);
        }
    }

    /// <summary>
    /// Retrieves the associated logins for the specified user.
    /// </summary>
    public override async getLoginsAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<UserLoginInfo[]> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullException.throwIfNull(user);

        return this.userLogins
            .where(l => l.userId === user.id)
            .select(l => new UserLoginInfo(l.loginProvider, l.providerKey, l.providerDisplayName ?? null))
            .toArray();
    }
    //#endregion

    //#region UserTokens
    /// <summary>
    /// Find a user token if it exists.
    /// </summary>
    protected override async findTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<TUserToken | null> {
        cancellationToken.throwIfCancellationRequested();

        return (this.userTokens.find(t => t.userId === user.id && t.loginProvider === loginProvider && t.name === name) as TUserToken) ?? null;
    }

    /// <summary>
    /// Add a new user token.
    /// </summary>
    protected override async addUserTokenAsync(token: IdentityUserToken<TKey>): Promise<void> {
        this.userTokens.add(token as TUserToken);
        await this.saveChanges(CancellationToken.none);
    }

    /// <summary>
    /// Remove a new user token.
    /// </summary>
    protected override async removeUserTokenAsync(token: IdentityUserToken<TKey>): Promise<void> {
        this.userTokens.remove(token as TUserToken);
        await this.saveChanges(CancellationToken.none);
    }
    //#endregion
}
