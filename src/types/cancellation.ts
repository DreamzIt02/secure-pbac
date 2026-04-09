/**
 * Represents a cancellation token.
 */
export interface ICancellationToken {
    // Stubbed out for symmetry; implement as needed.
}
export class CancellationToken implements ICancellationToken {
    throwIfCancellationRequested() {
        throw new Error("Cancellation requested. Aborting current action.");
    } 
    static none: CancellationToken = new CancellationToken(); 
}
