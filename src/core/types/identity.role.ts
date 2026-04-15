/// <summary>
/// Represents a role in the identity system
/// </summary>

import { AbstractEntity, AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { randomUUID } from "../../utils.js";
import { ILookupNormalizer, LookupNormalizer } from "../extensions/index.js";

/// <typeparam name="TKey">The type used for the primary key for the role.</typeparam>
@AbstractEntity()
export abstract class IdentityRoleGeneric<TKey> {
    private readonly normalizer: ILookupNormalizer;
    /// <summary>
    /// Initializes a new instance of IdentityRole<TKey>.
    /// </summary>
    constructor();
    constructor(roleName?: string);
    constructor(roleName?: string) {
        if (roleName) {
            this.name = roleName;
        }
        this.normalizer = new LookupNormalizer();
    }

    /// <summary>
    /// Gets or sets the primary key for this role.
    /// </summary>
    public id!: TKey;

    /// <summary>
    /// Gets or sets the name for this role.
    /// </summary>
    public name?: string | null;

    /// <summary>
    /// A random value that should change whenever a role is persisted to the store
    /// </summary>
    public concurrencyStamp: string = randomUUID();

    public get normalizedName(): string | null {
        return this.normalizer.normalizeName(this.name ?? null)
    }
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
export class IdentityRole<TKey extends AllowedPrimaryKeysSafe> extends IdentityRoleGeneric<TKey> {
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
    }
}
