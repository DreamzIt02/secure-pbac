import { AllowedPrimaryKeys, AllowedPrimaryKeysSafe } from "../../../contexts/index.js";
import { CancellationToken } from "../../../types/cancellation.js";
import { IdentityRole, IdentityRoleClaim, IdentityUser, IdentityUserClaim, IdentityUserLogin, IdentityUserRole, IdentityUserToken } from "../../types/index.js";
import { IQueryableUserStore } from "../stores/queryable.user.store.js";
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
import { UserStoreBase } from "./user.store.base.js";
import { IUserTwoFactorRecoveryCodeStore } from "./user.two_factor.recovery.code.store.js";
import { IUserTwoFactorStore } from "./user.two_factor.store.js";

export abstract class UserStoreBase1<
  TUser extends IdentityUser<TKey>,
  TRole extends IdentityRole<TKey>,
  TKey  extends AllowedPrimaryKeysSafe,
  TUserClaim extends IdentityUserClaim<TKey> = IdentityUserClaim<TKey>,
  TUserRole  extends IdentityUserRole<TKey>  = IdentityUserRole<TKey>,
  TUserLogin extends IdentityUserLogin<TKey> = IdentityUserLogin<TKey>,
  TUserToken extends IdentityUserToken<TKey> = IdentityUserToken<TKey>,
  TRoleClaim extends IdentityRoleClaim<TKey> = IdentityRoleClaim<TKey>,

> extends UserStoreBase<TUser, TKey, TUserClaim, TUserLogin, TUserToken
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
    IUserTwoFactorRecoveryCodeStore<TUser>,
    IUserRoleStore<TUser> 
{

    /// <summary>
    /// Called to create a new instance of a IdentityUserRole{TKey}.
    /// </summary>
    protected createUserRole(ctor: new () => TUserRole, user: TUser, role: TRole): TUserRole {
        const userRole: TUserRole = new ctor();

        userRole.userId = user.id;
        userRole.roleId = role.id;

        return userRole;
    }

    /// <summary>
    /// Retrieves all users in the specified role.
    /// </summary>
    public abstract getUsersInRoleAsync(normalizedRoleName: string, cancellationToken: CancellationToken): Promise<TUser[]>;

    /// <summary>
    /// Adds the given normalizedRoleName to the specified user.
    /// </summary>
    public abstract addToRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Removes the given normalizedRoleName from the specified user.
    /// </summary>
    public abstract removeFromRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken): Promise<void>;

    /// <summary>
    /// Retrieves the roles the specified user is a member of.
    /// </summary>
    public abstract getRolesAsync(user: TUser, cancellationToken: CancellationToken): Promise<string[]>;

    /// <summary>
    /// Returns a flag indicating if the specified user is a member of the given normalizedRoleName.
    /// </summary>
    public abstract isInRoleAsync(user: TUser, normalizedRoleName: string, cancellationToken: CancellationToken): Promise<boolean>;

    /// <summary>
    /// Return a role with the normalized name if it exists.
    /// </summary>
    protected abstract findRoleAsync(normalizedRoleName: string, cancellationToken: CancellationToken): Promise<TRole | null>;

    /// <summary>
    /// Return a user role for the userId and roleId if it exists.
    /// </summary>
    protected abstract findUserRoleAsync(userId: TKey, roleId: TKey, cancellationToken: CancellationToken): Promise<TUserRole | null>;
}
