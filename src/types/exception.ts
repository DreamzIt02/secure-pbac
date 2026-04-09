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
    static throwIf(disposed: boolean, obj: object): void { if (disposed) throw new Error("ObjectDisposedException"); } 
}

export class NotSupportedException extends Error {}
export class InvalidOperationException extends Error {}