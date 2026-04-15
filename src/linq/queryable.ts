/// <summary>
/// Represents a .NET-like IQueryable placeholder for symmetry with LINQ.
/// </summary>
export interface IQueryable<T> extends Iterable<T> {
    // Filtering
    where(predicate: (item: T) => boolean): IQueryable<T>;
    skip(count: number): IQueryable<T>;
    take(count: number): IQueryable<T>;

    // Projection
    select<U>(selector: (item: T) => U): IQueryable<U>;
    selectMany<U>(selector: (item: T) => Iterable<U>): IQueryable<U>;

    // Ordering
    orderBy<TKey>(keySelector: (item: T) => TKey): IQueryable<T>;
    orderByDescending<TKey>(keySelector: (item: T) => TKey): IQueryable<T>;

    // Grouping
    groupBy<TKey>(keySelector: (item: T) => TKey): IQueryable<{ key: TKey; items: T[] }>;

    // Joining
    join<U, K, R>(
        inner: IQueryable<U>,
        outerKeySelector: (item: T) => K,
        innerKeySelector: (item: U) => K,
        resultSelector: (outer: T, inner: U) => R
    ): IQueryable<R>;

    // Aggregation
    count(predicate?: (item: T) => boolean): number;
    sum(selector: (item: T) => number): number;
    average(selector: (item: T) => number): number;
    min(selector: (item: T) => number): number;
    max(selector: (item: T) => number): number;

    // Quantifiers
    any(predicate?: (item: T) => boolean): boolean;
    all(predicate: (item: T) => boolean): boolean;

    // Element operators
    first(predicate?: (item: T) => boolean): T | null;
    firstOrDefault(predicate?: (item: T) => boolean): T | null;
    single(predicate?: (item: T) => boolean): T | null;
    singleOrDefault(predicate?: (item: T) => boolean): T | null;

    // Conversion
    toArray(): T[];
}
