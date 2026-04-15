import { AbstractEntity, AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { randomUUID } from "../../utils.js";
import { ILookupNormalizer, LookupNormalizer } from "../extensions/index.js";

/**
 * Represents a user in the identity system.
 * @typeparam TKey The type used for the primary key for the user.
 */
@AbstractEntity()
export abstract class IdentityUserGeneric<TKey> {
    protected readonly normalizer: ILookupNormalizer;
    /**
     * Initializes a new instance of IdentityUser<TKey>.
     */
    constructor();
    /**
     * Initializes a new instance of IdentityUser<TKey>.
     * @param userName The user name.
     */
    constructor(userName: string);
    constructor(userName?: string) {
        if (userName) {
            this.userName = userName;
        }
        this.normalizer = new LookupNormalizer();
    }

    /** Gets or sets the primary key for this user. */
    id!: TKey;

    /** Gets or sets the user name for this user. */
    userName: string | null = null;

    /** Gets or sets the email address for this user. */
    email: string | null = null;

    /** Gets or sets a flag indicating if a user has confirmed their email address. */
    emailConfirmed: boolean = false;

    /** Gets or sets a salted and hashed representation of the password for this user. */
    passwordHash: string | null = null;

    /** A random value that must change whenever a user's credentials change (password changed, login removed). */
    securityStamp: string | null = randomUUID();

    /** A random value that must change whenever a user is persisted to the store. */
    concurrencyStamp: string | null = randomUUID();

    /** Gets or sets a telephone number for the user. */
    phoneNumber: string | null = null;

    /** Gets or sets a flag indicating if a user has confirmed their telephone number. */
    phoneNumberConfirmed: boolean = false;

    /** Gets or sets a flag indicating if two factor authentication is enabled for this user. */
    twoFactorEnabled: boolean = false;

    /**
     * Gets or sets the date and time, in UTC, when any user lockout ends.
     * A value in the past means the user is not locked out.
     */
    lockoutEnd: Date | null = null;

    /** Gets or sets a flag indicating if the user could be locked out. */
    lockoutEnabled: boolean = false;

    /** Gets or sets the number of failed login attempts for the current user. */
    accessFailedCount: number = 0;

    /** Returns the username for this user. */
    toString(): string {
        return this.userName ?? "";
    }

    public get normalizedUserName(): string | null {
        return this.normalizer.normalizeName(this.userName ?? null)
    }
    public get normalizedEmail(): string | null {
        return this.normalizer.normalizeEmail(this.email ?? null)
    }
}

/**
 * The default implementation of IdentityUser<TKey> which uses a string as a primary key.
 */
export class IdentityUser<TKey extends AllowedPrimaryKeysSafe> extends IdentityUserGeneric<TKey> {
    /**
     * Initializes a new instance of IdentityUser.
     * The Id property is initialized to form a new GUID string value.
     */
    constructor();
    /**
     * Initializes a new instance of IdentityUser.
     * The Id property is initialized to form a new GUID string value.
     * @param userName The user name.
     */
    constructor(userName: string);
    constructor(userName?: string) {
        super(userName!);
    }
}
