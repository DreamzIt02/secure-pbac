// exception.hresults.impl.ts

export class HResults {
    // DirectoryNotFoundException
    public static readonly COR_E_DIRECTORYNOTFOUND: number = 0x80070003;
    public static readonly STG_E_PATHNOTFOUND: number = 0x80030003;
    public static readonly CTL_E_PATHNOTFOUND: number = 0x800A004C;

    // FileNotFoundException
    public static readonly COR_E_FILENOTFOUND: number = 0x80070002;
    public static readonly CTL_E_FILENOTFOUND: number = 0x800A0035;

    public static readonly COR_E_EXCEPTION: number = 0x80131500;

    public static readonly COR_E_FILELOAD: number = 0x80131621;
    public static readonly FUSION_E_INVALID_NAME: number = 0x80131047;
    public static readonly FUSION_E_REF_DEF_MISMATCH: number = 0x80131040;
    public static readonly ERROR_TOO_MANY_OPEN_FILES: number = 0x80070004;
    public static readonly ERROR_SHARING_VIOLATION: number = 0x80070020;
    public static readonly ERROR_LOCK_VIOLATION: number = 0x80070021;
    public static readonly ERROR_OPEN_FAILED: number = 0x8007006E;
    public static readonly ERROR_DISK_CORRUPT: number = 0x80070571;
    public static readonly ERROR_UNRECOGNIZED_VOLUME: number = 0x800703ED;
    public static readonly ERROR_DLL_INIT_FAILED: number = 0x8007045A;
    public static readonly MSEE_E_ASSEMBLYLOADINPROGRESS: number = 0x80131016;
    public static readonly ERROR_FILE_INVALID: number = 0x800703EE;

    public static readonly COR_E_PATHTOOLONG: number = 0x800700CE;
    public static readonly COR_E_ARGUMENT   : number = 0x800701CE;
    public static readonly E_POINTER        : number = 0x800711CE;
    
}

export const Exceptions = {
    ArgumentNullException       : new Error("ArgumentNullException"),
    ArgumentNullOrEmptyException: new Error("ArgumentNullOrEmptyException"),
    ArgumentOutOfRangeException : new Error("ArgumentOutOfRangeException"),
    InvalidOperationException   : new Error("InvalidOperationException"),
    NotImplementedException     : new Error("NotImplementedException"),
};

export class ArgumentNullThrowHelper { 
    static throwIfNull(value: unknown): void { 
        if (value === null || value === undefined) {
            throw Exceptions.ArgumentNullException;
        }
    } 

    static throwIfNullOrEmpty(value: unknown): void { 
        if (value === null || value === undefined) {
            throw Exceptions.ArgumentNullOrEmptyException;
        }
        if (typeof value === "string" && value.length === 0) {
            throw Exceptions.ArgumentNullOrEmptyException;
        }
    } 

    static throwIfOutOfRange(index: number, length: number): void {
        if (index < 0 || index >= length) {
            throw Exceptions.ArgumentOutOfRangeException;
        }
    }

    static throwIfInvalidOperation(condition: boolean): void {
        if (condition) {
            throw Exceptions.InvalidOperationException;
        }
    }

    static throwNotImplemented(): never {
        throw Exceptions.NotImplementedException;
    }
}

export class ObjectDisposedThrowHelper { 
    static throwIf(disposed: boolean, obj: object): void { if (disposed) throw new ObjectDisposedException(); } 
}
export class ObjectDisposedException extends Error {
  constructor() {
    super("ObjectDisposedException");
    this.name = "ObjectDisposedException";
  }
}
export class NotSupportedException extends Error {}
export class InvalidOperationException extends Error {}

// system.exception.ts

/// <summary>
/// Represents errors that occur during application execution, similar to .NET SystemException.
/// </summary>
export class SystemException extends Error {
    protected _message?: string;
    public hResult?: number;

    constructor(message?: string, paramName?: string, innerException?: Error) {
        super(`${paramName ? paramName + ": " : ""}${message ?? "SystemException"}`);
        this.name = paramName ?? "SystemException";
        if (innerException) {
            // You can store inner exception details if needed
            (this as any).innerException = innerException;
        }
    }
}

/// <summary>
/// The exception that is thrown when one of the arguments provided to a method is not valid.
/// </summary>
export class ArgumentException extends SystemException {
    private readonly paramName?: string;

    /// <summary>
    /// Creates a new ArgumentException with its message string set to the empty string.
    /// </summary>
    constructor();
    constructor(message?: string, paramName?: string, innerException?: Error);
    constructor(message?: string, paramName?: string, innerException?: Error) {
        super(message ?? "Arg_ArgumentException", paramName, innerException);
        this.paramName = paramName;
        this.hResult = HResults.COR_E_ARGUMENT;
    }

    /// <summary>
    /// Gets the error message and the parameter name, if any.
    /// </summary>
    public override get message(): string {
        this.setMessageField();
        let s = super.message;
        if (this.paramName && this.paramName.length > 0) {
            s += " Arg_ParamName_Name: " + this.paramName;
        }
        return s;
    }

    private setMessageField(): void {
        if (!this._message && this.hResult === HResults.COR_E_ARGUMENT) {
            this._message = "Arg_ArgumentException";
        }
    }

    /// <summary>
    /// Gets the name of the parameter that caused the current exception.
    /// </summary>
    public get paramNameValue(): string | undefined {
        return this.paramName;
    }

    /// <summary>
    /// Throws an exception if argument is null or empty.
    /// </summary>
    public static throwIfNullOrEmpty(argument?: string, paramName?: string): void {
        if (!argument || argument.length === 0) {
            this.throwNullOrEmptyException(argument, paramName);
        }
    }

    /// <summary>
    /// Throws an exception if argument is null, empty, or consists only of white-space characters.
    /// </summary>
    public static throwIfNullOrWhiteSpace(argument?: string, paramName?: string): void {
        if (!argument || argument.trim().length === 0) {
            this.throwNullOrWhiteSpaceException(argument, paramName);
        }
    }

    private static throwNullOrEmptyException(argument?: string, paramName?: string): never {
        ArgumentNullException.throwIfNull(argument, paramName);
        throw new ArgumentException("Argument_EmptyString", paramName);
    }

    private static throwNullOrWhiteSpaceException(argument?: string, paramName?: string): never {
        ArgumentNullException.throwIfNull(argument, paramName);
        throw new ArgumentException("Argument_EmptyOrWhiteSpaceString", paramName);
    }
}

// exception.null.impl.ts

/// <summary>
/// The exception that is thrown when a null reference (Nothing in Visual Basic) is passed to a method that does not accept it as a valid argument.
/// </summary>
export class ArgumentNullException extends ArgumentException {

    /// <summary>
    /// Creates a new ArgumentNullException with its message string set to a default message explaining an argument was null.
    /// </summary>
    constructor();
    constructor(paramName?: string, message?: string, innerException?: Error);
    constructor(paramName?: string, message?: string, innerException?: Error) {
        super(message ?? "ArgumentNull_Generic", paramName, innerException);
        this.hResult = HResults.E_POINTER;
    }

    /// <summary>
    /// Throws an ArgumentNullException if argument is null.
    /// </summary>
    public static throwIfNull(argument?: object | string | null, paramName?: string): void {
        if (argument === null || argument === undefined) {
            this.throw(paramName);
        }
    }

    /// <summary>
    /// Throws an ArgumentNullException if argument is null (overload for pointer-like values).
    /// </summary>
    public static throwIfNullPointer(argument: unknown, paramName?: string): void {
        if (argument === null) {
            this.throw(paramName);
        }
    }

    /// <summary>
    /// Throws an ArgumentNullException if argument is IntPtr.Zero equivalent.
    /// </summary>
    public static throwIfNullIntPtr(argument: number, paramName?: string): void {
        if (argument === 0) {
            this.throw(paramName);
        }
    }

    /// <summary>
    /// Internal throw helper.
    /// </summary>
    private static throw(paramName?: string): never {
        throw new ArgumentNullException(paramName);
    }
}
