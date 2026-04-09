/// <summary>
/// Represents a role in the identity system
/// </summary>
/// <typeparam name="TKey">The type used for the primary key for the role.</typeparam>
export class IdentityRoleGeneric<TKey> {
    /// <summary>
    /// Initializes a new instance of IdentityRole<TKey>.
    /// </summary>
    constructor();
    constructor(roleName?: string);
    constructor(roleName?: string) {
        if (roleName) {
            this.name = roleName;
        }
    }

    /// <summary>
    /// Gets or sets the primary key for this role.
    /// </summary>
    public id!: TKey;

    /// <summary>
    /// Gets or sets the name for this role.
    /// </summary>
    public name?: string;

    /// <summary>
    /// A random value that should change whenever a role is persisted to the store
    /// </summary>
    public concurrencyStamp: string = crypto.randomUUID();

    /// <summary>
    /// Returns the name of the role.
    /// </summary>
    /// <returns>The name of the role.</returns>
    public toString(): string {
        return this.name ?? "";
    }
}

/// <summary>
/// The default implementation of IdentityRole<TKey> which uses a string as the primary key.
/// </summary>
export class IdentityRole extends IdentityRoleGeneric<string> {
    /// <summary>
    /// Initializes a new instance of IdentityRole.
    /// </summary>
    /// <remarks>
    /// The id property is initialized to form a new GUID string value.
    /// </remarks>
    constructor();
    constructor(roleName?: string);
    constructor(roleName?: string) {
        super(roleName);
        this.id = crypto.randomUUID();
        if (roleName) {
            this.name = roleName;
        }
    }
}
