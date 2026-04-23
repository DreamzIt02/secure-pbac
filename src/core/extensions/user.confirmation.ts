import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { IUserManager } from "../identity/index.js";
import { IdentityUser } from "../types/index.js";

/// <summary>
/// Provides an abstraction for confirmation of user accounts.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export interface IUserConfirmation<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> {
    /// <summary>
    /// Determines whether the specified user is confirmed.
    /// </summary>
    /// <param name="manager">The UserManager that can be used to retrieve user properties.</param>
    /// <param name="user">The user.</param>
    /// <returns>Whether the user is confirmed.</returns>
    isConfirmedAsync(manager: IUserManager<TKey, TUser>, user: TUser): Promise<boolean>;
}

// export class UserConfirmation<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserConfirmation<TKey, TUser> {
//     isConfirmedAsync(manager: IUserManager<TKey, TUser>, user: TUser): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }
// }

/// <summary>
/// Default implementation of <see cref="IUserConfirmation{TUser}"/>.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export class DefaultUserConfirmation<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> implements IUserConfirmation<TKey, TUser>
{
    /// <summary>
    /// Determines whether the specified <paramref name="user"/> is confirmed.
    /// </summary>
    /// <param name="manager">The <see cref="UserManager{TUser}"/> that can be used to retrieve user properties.</param>
    /// <param name="user">The user.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation, containing the <see cref="IdentityResult"/> of the confirmation operation.</returns>
    public async isConfirmedAsync(manager: IUserManager<TKey, TUser>, user: TUser): Promise<boolean>
    {
        return await manager.isEmailConfirmedAsync(user);
    }
}
