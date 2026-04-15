import { Claim } from "../../../claims/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { ArgumentNullThrowHelper, ObjectDisposedThrowHelper } from "../../../types/exception.js";
import { IdentityErrorDescriber, IdentityResult } from "../../identity/index.js";
import { IdentityUser } from "../../types/identity.user.js";
import { IdentityUserClaim, IdentityUserLogin, IdentityUserToken, UserLoginInfo } from "../../types/index.js";
import { IQueryable } from "../../../linq/queryable.js";
import { IQueryableUserStore } from "../stores/queryable.user.store.js";
import { IUserAuthenticatorKeyStore } from "./user.authentication.key.store.js";
import { IUserAuthenticationTokenStore } from "./user.authentication.token.store.js";
import { IUserClaimStore } from "./user.claim.store.js";
import { IUserEmailStore } from "./user.email.store.js";
import { IUserLockoutStore } from "./user.lockout.store.js";
import { IUserLoginStore } from "./user.login.store.js";
import { IUserPasswordStore } from "./user.password.store.js";
import { IUserPhoneNumberStore } from "./user.phone.store.js";
import { IUserSecurityStampStore } from "./user.security.stamp.store.js";
import { IUserTwoFactorRecoveryCodeStore } from "./user.two_factor.recovery.code.store.js";
import { IUserTwoFactorStore } from "./user.two_factor.store.js";
import { AllowedPrimaryKeysSafe, TypeDescriptor } from "../../../contexts/index.js";

/// <summary>
/// Represents a new instance of a persistence store for the specified user type.
/// </summary>
/// <typeparam name="TUser">The type representing a user.</typeparam>
/// <typeparam name="TKey">The type of the primary key for a user.</typeparam>
/// <typeparam name="TUserClaim">The type representing a claim.</typeparam>
/// <typeparam name="TUserLogin">The type representing a user external login.</typeparam>
/// <typeparam name="TUserToken">The type representing a user token.</typeparam>
export abstract class UserStoreBase<
  TUser extends IdentityUser<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
> implements
    IUserLoginStore<TUser>,
    IUserClaimStore<TUser>,
    IUserPasswordStore<TKey, TUser>,
    IUserSecurityStampStore<TUser>,
    IUserEmailStore<TKey, TUser>,
    IUserLockoutStore<TUser>,
    IUserPhoneNumberStore<TUser>,
    IQueryableUserStore<TUser>,
    IUserTwoFactorStore<TUser>,
    IUserAuthenticationTokenStore<TKey, TUser>,
    IUserAuthenticatorKeyStore<TUser>,
    IUserTwoFactorRecoveryCodeStore<TUser>
{
  /// <summary>
  /// Creates a new instance.
  /// </summary>
  /// <param name="describer">The IdentityErrorDescriber used to describe store errors.</param>
  constructor(describer: IdentityErrorDescriber) {
    ArgumentNullThrowHelper.throwIfNull(describer);
    this.errorDescriber = describer;
  }
  
  [Symbol.dispose](): void {
    // TODO: Dispose
  }

  private _disposed: boolean = false;

  /// <summary>
  /// Gets or sets the IdentityErrorDescriber for any error that occurred with the current operation.
  /// </summary>
  public errorDescriber: IdentityErrorDescriber;

  /// <summary>
  /// Called to create a new instance of a IdentityUserClaim{TKey}.
  /// </summary>
  protected createUserClaim(ctor: new () => TUserClaim, user: TUser, claim: Claim): TUserClaim {
    const userClaim: TUserClaim = new ctor();
    
    userClaim.userId = user.id;
    userClaim.initializeFromClaim(claim);
    
    return userClaim;
  }

  /// <summary>
  /// Called to create a new instance of a IdentityUserLogin{TKey}.
  /// </summary>
  protected createUserLogin(ctor: new () => TUserLogin, user: TUser, login: UserLoginInfo): TUserLogin {
    const userLogin: TUserLogin = new ctor();

    userLogin.userId = user.id;
    userLogin.providerKey = login.providerKey;
    userLogin.loginProvider = login.loginProvider;
    userLogin.providerDisplayName = login.providerDisplayName;

    return userLogin;
  }

  /// <summary>
  /// Called to create a new instance of a IdentityUserToken{TKey}.
  /// </summary>
  protected createUserToken(ctor: new () => TUserToken, user: TUser, loginProvider: string, name: string, value?: string | null): TUserToken {
    const userToken: TUserToken = new ctor();

    userToken.userId = user.id;
    userToken.loginProvider = loginProvider;
    userToken.name = name;
    userToken.value = value;

    return userToken;
  }

  /// <summary>
  /// Gets the user identifier for the specified user.
  /// </summary>
  public async getUserIdAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullThrowHelper.throwIfNull(user);
    return Promise.resolve(this.convertIdToString(user.id as any)!);
  }

  /// <summary>
  /// Gets the user name for the specified user.
  /// </summary>
  public async getUserNameAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullThrowHelper.throwIfNull(user);
    return Promise.resolve(user.userName);
  }

  /// <summary>
  /// Sets the given userName for the specified user.
  /// </summary>
  public async setUserNameAsync(user: TUser, userName: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullThrowHelper.throwIfNull(user);
    user.userName = userName;
    return Promise.resolve();
  }

  /// <summary>
  /// Gets the normalized user name for the specified user.
  /// </summary>
  public async getNormalizedUserNameAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullThrowHelper.throwIfNull(user);
    return Promise.resolve(user.userName?.toUpperCase() ?? null);
  }

  /// <summary>
  /// Sets the given normalized name for the specified user.
  /// </summary>
  public async setNormalizedUserNameAsync(user: TUser, normalizedName: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
    cancellationToken.throwIfCancellationRequested();
    this.throwIfDisposed();
    ArgumentNullThrowHelper.throwIfNull(user);
    return Promise.resolve();
  }

    /// <summary>
    /// Creates the specified <paramref name="user"/> in the user store.
    /// </summary>
    public abstract createAsync(user: TUser, cancellationToken: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Updates the specified <paramref name="user"/> in the user store.
    /// </summary>
    public abstract updateAsync(user: TUser, cancellationToken: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Deletes the specified <paramref name="user"/> from the user store.
    /// </summary>
    public abstract deleteAsync(user: TUser, cancellationToken: CancellationToken): Promise<IdentityResult>;

    /// <summary>
    /// Finds and returns a user, if any, who has the specified <paramref name="userId"/>.
    /// </summary>
    public abstract findByIdAsync(userId: string, cancellationToken: CancellationToken): Promise<TUser | null>;

    /// <summary>
    /// Converts the provided <paramref name="id"/> to a strongly typed key object.
    /// </summary>
    public convertIdFromString<TKey>(id?: string | null): TKey | null {
        if (id === undefined || id == null) return null;

        // Delegate to TypeDescriptor
        return TypeDescriptor.convertFromString<TKey>(id, "" as TKey) as TKey;
    }

    /// <summary>
    /// Converts the provided <paramref name="id"/> to its string representation.
    /// </summary>
    public convertIdToString<TKey>(id: TKey): string | null {
        if (id === undefined || id == null) return null;

        return TypeDescriptor.convertToString(id);
    }

    /// <summary>
    /// Finds and returns a user, if any, who has the specified normalized user name.
    /// </summary>
    public abstract findByNameAsync(normalizedUserName: string, cancellationToken: CancellationToken): Promise<TUser | null>;

    /// <summary>
    /// A navigation property for the users the store contains.
    /// </summary>
    public abstract users: IQueryable<TUser>;

    /// <summary>
    /// Sets the password hash for a user.
    /// </summary>
    public async setPasswordHashAsync(user: TUser, passwordHash: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.passwordHash = passwordHash;
        return Promise.resolve();
    }

    /// <summary>
    /// Gets the password hash for a user.
    /// </summary>
    public async getPasswordHashAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.passwordHash);
    }

    /// <summary>
    /// Returns a flag indicating if the specified user has a password.
    /// </summary>
    public async hasPasswordAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        return Promise.resolve(user.passwordHash != null);
    }

    /// <summary>
    /// Return a user with the matching userId if it exists.
    /// </summary>
    protected abstract findUserAsync(userId: TKey, cancellationToken: CancellationToken): Promise<TUser | null>;

    /// <summary>
    /// Return a user login with the matching userId, provider, providerKey if it exists.
    /// </summary>
    protected abstract findUserLoginAsync(userId: TKey, loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<TUserLogin | null>;

    /// <summary>
    /// Return a user login with provider, providerKey if it exists.
    /// </summary>
    protected abstract findUserLoginAsync(loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<TUserLogin | null>;


    /// <summary>
    /// Throws if this class has been disposed.
    /// </summary>
    protected throwIfDisposed(): void {
        ObjectDisposedThrowHelper.throwIf(this._disposed, this);
    }

    /// <summary>
    /// Dispose the store.
    /// </summary>
    public dispose(): void {
        this._disposed = true;
    }

    /// <summary>
    /// Get the claims associated with the specified user as an asynchronous operation.
    /// </summary>
    public abstract getClaimsAsync(user: TUser, cancellationToken: CancellationToken): Promise<Claim[]>;

    /// <summary>
    /// Adds the claims given to the specified user.
    /// </summary>
    public abstract addClaimsAsync(user: TUser, claims: Claim[], cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Replaces the claim on the specified user with the newClaim.
    /// </summary>
    public abstract replaceClaimAsync(user: TUser, claim: Claim, newClaim: Claim, cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Removes the claims given from the specified user.
    /// </summary>
    public abstract removeClaimsAsync(user: TUser, claims: Claim[], cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Adds the login given to the specified user.
    /// </summary>
    public abstract addLoginAsync(user: TUser, login: UserLoginInfo, cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Removes the loginProvider given from the specified user.
    /// </summary>
    public abstract removeLoginAsync(user: TUser, loginProvider: string, providerKey: string, cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Retrieves the associated logins for the specified user.
    /// </summary>
    public abstract getLoginsAsync(user: TUser, cancellationToken: CancellationToken): Promise<UserLoginInfo[]>;

    /// <summary>
    /// Retrieves the user associated with the specified login provider and login provider key.
    /// </summary>
    public async findByLoginAsync(loginProvider: string, providerKey: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<TUser | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        const userLogin = await this.findUserLoginAsync(loginProvider, providerKey, cancellationToken);
        if (userLogin != null) {
            return await this.findUserAsync(userLogin.userId, cancellationToken);
        }
        return null;
    }

    /// <summary>
    /// Gets a flag indicating whether the email address for the specified user has been verified.
    /// </summary>
    public async getEmailConfirmedAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.emailConfirmed);
    }

    /// <summary>
    /// Sets the flag indicating whether the specified user's email address has been confirmed.
    /// </summary>
    public async setEmailConfirmedAsync(user: TUser, confirmed: boolean, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.emailConfirmed = confirmed;
        return Promise.resolve();
    }

    /// <summary>
    /// Sets the email address for a user.
    /// </summary>
    public async setEmailAsync(user: TUser, email: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.email = email;
        return Promise.resolve();
    }

    /// <summary>
    /// Gets the email address for the specified user.
    /// </summary>
    public async getEmailAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.email);
    }

    /// <summary>
    /// Returns the normalized email for the specified user.
    /// </summary>
    public async getNormalizedEmailAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.userName?.toUpperCase() ?? null);
    }

    /// <summary>
    /// Sets the normalized email for the specified user.
    /// </summary>
    public async setNormalizedEmailAsync(user: TUser, normalizedEmail: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve();
    }

    /// <summary>
    /// Gets the user associated with the specified normalized email address.
    /// </summary>
    public abstract findByEmailAsync(normalizedEmail: string, cancellationToken: CancellationToken): Promise<TUser | null>;

    /// <summary>
    /// Gets the last DateTimeOffset a user's last lockout expired.
    /// </summary>
    public async getLockoutEndDateAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<Date | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.lockoutEnd);
    }

    /// <summary>
    /// Locks out a user until the specified end date has passed.
    /// </summary>
    public async setLockoutEndDateAsync(user: TUser, lockoutEnd: Date | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.lockoutEnd = lockoutEnd;
        return Promise.resolve();
    }

    /// <summary>
    /// Records that a failed access has occurred.
    /// </summary>
    public async incrementAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<number> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.accessFailedCount++;
        return Promise.resolve(user.accessFailedCount);
    }

    /// <summary>
    /// Resets a user's failed access count.
    /// </summary>
    public async resetAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.accessFailedCount = 0;
        return Promise.resolve();
    }

    /// <summary>
    /// Retrieves the current failed access count for the specified user.
    /// </summary>
    public async getAccessFailedCountAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<number> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.accessFailedCount);
    }

    /// <summary>
    /// Retrieves a flag indicating whether user lockout can be enabled.
    /// </summary>
    public async getLockoutEnabledAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.lockoutEnabled);
    }

    /// <summary>
    /// Set the flag indicating if the specified user can be locked out.
    /// </summary>
    public async setLockoutEnabledAsync(user: TUser, enabled: boolean, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.lockoutEnabled = enabled;
        return Promise.resolve();
    }

    /// <summary>
    /// Sets the telephone number for the specified user.
    /// </summary>
    public async setPhoneNumberAsync(user: TUser, phoneNumber: string | null, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.phoneNumber = phoneNumber;
        return Promise.resolve();
    }

    /// <summary>
    /// Gets the telephone number for the specified user.
    /// </summary>
    public async getPhoneNumberAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.phoneNumber);
    }

    /// <summary>
    /// Gets a flag indicating whether the specified user's telephone number has been confirmed.
    /// </summary>
    public async getPhoneNumberConfirmedAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.phoneNumberConfirmed);
    }

    /// <summary>
    /// Sets a flag indicating if the specified user's phone number has been confirmed.
    /// </summary>
    public async setPhoneNumberConfirmedAsync(user: TUser, confirmed: boolean, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.phoneNumberConfirmed = confirmed;
        return Promise.resolve();
    }

    /// <summary>
    /// Sets the provided security stamp for the specified user.
    /// </summary>
    public async setSecurityStampAsync(user: TUser, stamp: string, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        ArgumentNullThrowHelper.throwIfNull(stamp);
        user.securityStamp = stamp;
        return Promise.resolve();
    }

    /// <summary>
    /// Get the security stamp for the specified user.
    /// </summary>
    public async getSecurityStampAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        
        return Promise.resolve(user.securityStamp);
    }

        /// <summary>
    /// Sets a flag indicating whether the specified user has two factor authentication enabled.
    /// </summary>
    public async setTwoFactorEnabledAsync(user: TUser, enabled: boolean, cancellationToken: CancellationToken = CancellationToken.none): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        user.twoFactorEnabled = enabled;
        return Promise.resolve();
    }

    /// <summary>
    /// Returns a flag indicating whether the specified user has two factor authentication enabled.
    /// </summary>
    public async getTwoFactorEnabledAsync(user: TUser, cancellationToken: CancellationToken = CancellationToken.none): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        return Promise.resolve(user.twoFactorEnabled);
    }

    /// <summary>
    /// Retrieves all users with the specified claim.
    /// </summary>
    public abstract getUsersForClaimAsync(claim: Claim, cancellationToken: CancellationToken): Promise<TUser[]>;

    /// <summary>
    /// Find a user token if it exists.
    /// </summary>
    protected abstract findTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<TUserToken | null>;

    /// <summary>
    /// Add a new user token.
    /// </summary>
    protected abstract addUserTokenAsync(token: TUserToken): Promise<void>;

    /// <summary>
    /// Remove a user token.
    /// </summary>
    protected abstract removeUserTokenAsync(token: TUserToken): Promise<void>;

    /// <summary>
    /// Sets the token value for a particular user.
    /// </summary>
    public async setTokenAsync(user: TUser, loginProvider: string, name: string, value: string | null, cancellationToken: CancellationToken): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);

        const token = await this.findTokenAsync(user, loginProvider, name, cancellationToken);
        if (token == null) {
            await this.addUserTokenAsync(
                this.createUserToken(IdentityUserToken as new () => TUserToken, user, loginProvider, name, value));
        } else {
            (token as any).value = value;
        }
    }

    /// <summary>
    /// Deletes a token for a user.
    /// </summary>
    public async removeTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);

        const entry = await this.findTokenAsync(user, loginProvider, name, cancellationToken);
        if (entry != null) {
            await this.removeUserTokenAsync(entry);
        }
    }

    /// <summary>
    /// Returns the token value.
    /// </summary>
    public async getTokenAsync(user: TUser, loginProvider: string, name: string, cancellationToken: CancellationToken): Promise<string | null> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);

        const entry = await this.findTokenAsync(user, loginProvider, name, cancellationToken);
        return entry ? (entry as any).value : null;
    }

    private static readonly internalLoginProvider: string = "[AspNetUserStore]";
    private static readonly authenticatorKeyTokenName: string = "AuthenticatorKey";
    private static readonly recoveryCodeTokenName: string = "RecoveryCodes";

    /// <summary>
    /// Sets the authenticator key for the specified user.
    /// </summary>
    public async setAuthenticatorKeyAsync(user: TUser, key: string, cancellationToken: CancellationToken): Promise<void> {
        return this.setTokenAsync(user, UserStoreBase.internalLoginProvider, UserStoreBase.authenticatorKeyTokenName, key, cancellationToken);
    }

    /// <summary>
    /// Get the authenticator key for the specified user.
    /// </summary>
    public async getAuthenticatorKeyAsync(user: TUser, cancellationToken: CancellationToken): Promise<string | null> {
        return this.getTokenAsync(user, UserStoreBase.internalLoginProvider, UserStoreBase.authenticatorKeyTokenName, cancellationToken);
    }

    /// <summary>
    /// Returns how many recovery codes are still valid for a user.
    /// </summary>
    public async countCodesAsync(user: TUser, cancellationToken: CancellationToken): Promise<number> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);

        const mergedCodes = await this.getTokenAsync(user, UserStoreBase.internalLoginProvider, UserStoreBase.recoveryCodeTokenName, cancellationToken) ?? "";
        if (mergedCodes.length > 0) {
            let count = 1;
            let index = 0;
            while (index < mergedCodes.length) {
                const semiColonIndex = mergedCodes.indexOf(";", index);
                if (semiColonIndex < 0) break;
                count++;
                index = semiColonIndex + 1;
            }
            return count;
        }
        return 0;
    }

    /// <summary>
    /// Updates the recovery codes for the user while invalidating any previous recovery codes.
    /// </summary>
    public async replaceCodesAsync(user: TUser, recoveryCodes: string[], cancellationToken: CancellationToken): Promise<void> {
        const mergedCodes = recoveryCodes.join(";");
        return this.setTokenAsync(user, UserStoreBase.internalLoginProvider, UserStoreBase.recoveryCodeTokenName, mergedCodes, cancellationToken);
    }

    /// <summary>
    /// Returns whether a recovery code is valid for a user.
    /// </summary>
    public async redeemCodeAsync(user: TUser, code: string, cancellationToken: CancellationToken): Promise<boolean> {
        cancellationToken.throwIfCancellationRequested();
        this.throwIfDisposed();
        ArgumentNullThrowHelper.throwIfNull(user);
        ArgumentNullThrowHelper.throwIfNullOrEmpty(code);

        const mergedCodes = await this.getTokenAsync(user, UserStoreBase.internalLoginProvider, UserStoreBase.recoveryCodeTokenName, cancellationToken) ?? "";
        const splitCodes = mergedCodes.split(";");
        if (splitCodes.includes(code)) {
            const updatedCodes = splitCodes.filter(s => s !== code);
            await this.replaceCodesAsync(user, updatedCodes, cancellationToken);
            return true;
        }
        return false;
    }

}
