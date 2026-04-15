/**
 * Represents a cancellation token.
 */
export interface ICancellationToken {
    // Stubbed out for symmetry; implement as needed.
    cancel(): void;
    throwIfCancellationRequested(): void;
}
export class CancellationToken implements ICancellationToken {
    private cancelled = false;

    /** Call this to request cancellation */
    cancel(): void {
        this.cancelled = true;
    }

    /** Throws only if cancellation has been requested */
    throwIfCancellationRequested(): void {
        if (this.cancelled) {
            throw new Error("Cancellation requested. Aborting current action.");
        }
    }

    /** A token that never cancels */
    static none: CancellationToken = new CancellationToken();
}

