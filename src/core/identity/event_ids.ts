/// <summary>
/// Represents a logging event identifier.
/// </summary>
export class EventId {
    public id: number;
    public name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}
/// <summary>
/// Represents event identifiers used in Identity logging.
/// </summary>
export class EventIds {
    public static readonly userCannotSignInWithoutConfirmedEmail: EventId = new EventId(0, "UserCannotSignInWithoutConfirmedEmail");
    public static readonly securityStampValidationFailed: EventId = new EventId(0, "SecurityStampValidationFailed");
    public static readonly securityStampValidationFailedId4: EventId = new EventId(4, "SecurityStampValidationFailed");
    public static readonly userCannotSignInWithoutConfirmedPhoneNumber: EventId = new EventId(1, "UserCannotSignInWithoutConfirmedPhoneNumber");
    public static readonly invalidPassword: EventId = new EventId(2, "InvalidPassword");
    public static readonly userLockedOut: EventId = new EventId(3, "UserLockedOut");
    public static readonly userCannotSignInWithoutConfirmedAccount: EventId = new EventId(4, "UserCannotSignInWithoutConfirmedAccount");
    public static readonly twoFactorSecurityStampValidationFailed: EventId = new EventId(5, "TwoFactorSecurityStampValidationFailed");
    public static readonly noPasskeyCreationOptions: EventId = new EventId(6, "NoPasskeyCreationOptions");
    public static readonly userDoesNotMatchPasskeyCreationOptions: EventId = new EventId(7, "UserDoesNotMatchPasskeyCreationOptions");
    public static readonly passkeyAttestationFailed: EventId = new EventId(8, "PasskeyAttestationFailed");
    public static readonly passkeyAssertionFailed: EventId = new EventId(9, "PasskeyAssertionFailed");
}

