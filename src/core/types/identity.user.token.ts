// identity.user.token.ts

/// <summary>
/// Represents an authentication token for a user.
/// </summary>
/// <typeparam name="TKey">The type of the primary key used for users.</typeparam>
export class IdentityUserToken<TKey> {
    /// <summary>
    /// Gets or sets the primary key of the user that the token belongs to.
    /// </summary>
    public userId!: TKey;

    /// <summary>
    /// Gets or sets the LoginProvider this token is from.
    /// </summary>
    public loginProvider: string = "";

    /// <summary>
    /// Gets or sets the name of the token.
    /// </summary>
    public name: string = "";

    /// <summary>
    /// Gets or sets the token value.
    /// </summary>
    public value?: string | null;
}
