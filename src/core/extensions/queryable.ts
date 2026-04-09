
/// <summary>
/// Represents a .NET-like IQueryable placeholder for symmetry.
/// </summary>
export interface IQueryable<T> extends Iterable<T> {
    // Stubbed methods for symmetry with LINQ IQueryable
    where(predicate: (item: T) => boolean): IQueryable<T>;
    select<U>(selector: (item: T) => U): IQueryable<U>;
    toArray(): T[];
}
