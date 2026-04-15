

/// <summary>
/// Represents the result of a sign-in operation.
/// </summary>
export class SignInResult {
    private static readonly _success: SignInResult = new SignInResult({ succeeded: true });
    private static readonly _failed: SignInResult = new SignInResult();
    private static readonly _lockedOut: SignInResult = new SignInResult({ isLockedOut: true });
    private static readonly _notAllowed: SignInResult = new SignInResult({ isNotAllowed: true });
    private static readonly _twoFactorRequired: SignInResult = new SignInResult({ requiresTwoFactor: true });

    /// <summary>
    /// Returns a flag indication whether the sign-in was successful.
    /// </summary>
    public succeeded: boolean;

    /// <summary>
    /// Returns a flag indication whether the user attempting to sign-in is locked out.
    /// </summary>
    public isLockedOut: boolean;

    /// <summary>
    /// Returns a flag indication whether the user attempting to sign-in is not allowed to sign-in.
    /// </summary>
    public isNotAllowed: boolean;

    /// <summary>
    /// Returns a flag indication whether the user attempting to sign-in requires two factor authentication.
    /// </summary>
    public requiresTwoFactor: boolean;

    constructor(init?: { succeeded?: boolean; isLockedOut?: boolean; isNotAllowed?: boolean; requiresTwoFactor?: boolean }) {
        this.succeeded = init?.succeeded ?? false;
        this.isLockedOut = init?.isLockedOut ?? false;
        this.isNotAllowed = init?.isNotAllowed ?? false;
        this.requiresTwoFactor = init?.requiresTwoFactor ?? false;
    }

    /// <summary>
    /// Returns a SignInResult that represents a successful sign-in.
    /// </summary>
    public static get success(): SignInResult {
        return SignInResult._success;
    }

    /// <summary>
    /// Returns a SignInResult that represents a failed sign-in.
    /// </summary>
    public static get failed(): SignInResult {
        return SignInResult._failed;
    }

    /// <summary>
    /// Returns a SignInResult that represents a sign-in attempt that failed because the user was locked out.
    /// </summary>
    public static get lockedOut(): SignInResult {
        return SignInResult._lockedOut;
    }

    /// <summary>
    /// Returns a SignInResult that represents a sign-in attempt that failed because the user is not allowed to sign-in.
    /// </summary>
    public static get notAllowed(): SignInResult {
        return SignInResult._notAllowed;
    }

    /// <summary>
    /// Returns a SignInResult that represents a sign-in attempt that needs two-factor authentication.
    /// </summary>
    public static get twoFactorRequired(): SignInResult {
        return SignInResult._twoFactorRequired;
    }

    /// <summary>
    /// Converts the value of the current SignInResult object to its equivalent string representation.
    /// </summary>
    public toString(): string {
        return this.isLockedOut ? "LockedOut" :
               this.isNotAllowed ? "NotAllowed" :
               this.requiresTwoFactor ? "RequiresTwoFactor" :
               this.succeeded ? "Succeeded" : "Failed";
    }
}
