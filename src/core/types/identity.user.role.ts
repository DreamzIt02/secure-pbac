// identity.user.role.ts

/// <summary>
/// Represents the link between a user and a role.
/// </summary>
/// <typeparam name="TKey">The type of the primary key used for users and roles.</typeparam>
export class IdentityUserRole<TKey> {
    constructor();
    constructor(userId: TKey, roleId: TKey);
    constructor(userId?: TKey, roleId?: TKey) {
        if (userId)
            this.userId = userId;
        if (roleId)
            this.roleId = roleId;
    }
    /// <summary>
    /// Gets or sets the primary key of the user that is linked to a role.
    /// </summary>
    public userId!: TKey;

    /// <summary>
    /// Gets or sets the primary key of the role that is linked to the user.
    /// </summary>
    public roleId!: TKey;
}
