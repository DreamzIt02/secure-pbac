// identity.user.login.ts

/// <summary>
/// Represents a login and its associated provider for a user.
/// </summary>
/// <typeparam name="TKey">The type of the primary key of the user associated with this login.</typeparam>
export class IdentityUserLogin<TKey> {
    /// <summary>
    /// Gets or sets the primary key of the user associated with this login.
    /// </summary>
    public userId!: TKey;

    /// <summary>
    /// Gets or sets the unique provider identifier for this login.
    /// </summary>
    public providerKey: string = "";

    /// <summary>
    /// Gets or sets the login provider for the login (e.g. facebook, google).
    /// </summary>
    public loginProvider: string = "";

    /// <summary>
    /// Gets or sets the friendly name used in a UI for this login.
    /// </summary>
    public providerDisplayName?: string | null;
}
