import { IQueryable } from "./queryable.js";

export type QueryExpressionType = "Root" | "Unknown"
    // CRUD
    | "Insert" | "Attach" | "Update" | "Delete"
    // Filtering
    | "Where" | "Skip" | "Take" 
    // Projection
    | "Select" | "SelectMany"
    // Ordering
    | "OrderBy" | "OrderByDescending" 
    // Grouping
    | "GroupBy" 
    // Joining
    | "Join" 
    // Aggregation
    | "Count" | "Sum" | "Average" | "Max" | "Min"
    // Quantifiers
    | "Any" | "All"
    // Element operators
    | "First" | "FirstOrDefault" | "Single" | "SingleOrDefault"
    // Convenience
    | "Find"

/// <summary>
/// Represents a query expression tree (like Expression in .NET).
/// </summary>
export interface QueryExpression {
    type: QueryExpressionType; // e.g. "Where", "Select", "OrderBy"
    args: any[];               // arguments for the operator
    source?: QueryExpression;  // nested source expression
}

/// <summary>
/// Defines a query provider that can translate LINQ-like queries into database commands.
/// </summary>
export interface IQueryProvider {
    createQuery<T>(expression: QueryExpression): IQueryable<T>;
    execute<T>(expression: QueryExpression): T;
}

export interface ISqlQueryProvider extends IQueryProvider {
    connection: any; // database client or connection string
}

export class DatabaseQueryable<T> implements IQueryable<T> {
    constructor(
        private readonly provider  : IQueryProvider,
        private readonly expression: QueryExpression
    ) {}

    *[Symbol.iterator](): Iterator<T> {
        // Materialize results from provider
        const results = this.provider.execute<T[]>(this.expression);
        yield* results;
    }

    // Filtering
    public where(predicate: (item: T) => boolean): IQueryable<T> {
        const expr: QueryExpression = {
            type: "Where",
            args: [predicate],
            source: this.expression
        };
        return new DatabaseQueryable<T>(this.provider, expr);
    }

    public skip(count: number): IQueryable<T> {
        const expr: QueryExpression = {
            type: "Skip",
            args: [count],
            source: this.expression
        };
        return new DatabaseQueryable<T>(this.provider, expr);
    }

    public take(count: number): IQueryable<T> {
        const expr: QueryExpression = {
            type: "Take",
            args: [count],
            source: this.expression
        };
        return new DatabaseQueryable<T>(this.provider, expr);
    }

    // Projection
    public select<U>(selector: (item: T) => U): IQueryable<U> {
        const expr: QueryExpression = {
            type: "Select",
            args: [selector],
            source: this.expression
        };
        return new DatabaseQueryable<U>(this.provider, expr);
    }

    public selectMany<U>(selector: (item: T) => Iterable<U>): IQueryable<U> {
        const expr: QueryExpression = {
            type: "SelectMany",
            args: [selector],
            source: this.expression
        };
        return new DatabaseQueryable<U>(this.provider, expr);
    }

    // Ordering
    public orderBy<TKey>(keySelector: (item: T) => TKey): IQueryable<T> {
        const expr: QueryExpression = {
            type: "OrderBy",
            args: [keySelector],
            source: this.expression
        };
        return new DatabaseQueryable<T>(this.provider, expr);
    }

    public orderByDescending<TKey>(keySelector: (item: T) => TKey): IQueryable<T> {
        const expr: QueryExpression = {
            type: "OrderByDescending",
            args: [keySelector],
            source: this.expression
        };
        return new DatabaseQueryable<T>(this.provider, expr);
    }

    // Grouping
    public groupBy<TKey>(keySelector: (item: T) => TKey): IQueryable<{ key: TKey; items: T[] }> {
        const expr: QueryExpression = {
            type: "GroupBy",
            args: [keySelector],
            source: this.expression
        };
        return new DatabaseQueryable<{ key: TKey; items: T[] }>(this.provider, expr);
    }

    // Joining
    public join<U, K, R>(
        inner: IQueryable<U>,
        outerKeySelector: (item: T) => K,
        innerKeySelector: (item: U) => K,
        resultSelector: (outer: T, inner: U) => R
    ): IQueryable<R> {
        const expr: QueryExpression = {
            type: "Join",
            args: [inner, outerKeySelector, innerKeySelector, resultSelector],
            source: this.expression
        };
        return new DatabaseQueryable<R>(this.provider, expr);
    }

    // Aggregation
    public count(predicate?: (item: T) => boolean): number {
        const expr: QueryExpression = {
            type: "Count",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<number>(expr);
    }

    public sum(selector: (item: T) => number): number {
        const expr: QueryExpression = {
            type: "Sum",
            args: [selector],
            source: this.expression
        };
        return this.provider.execute<number>(expr);
    }

    public average(selector: (item: T) => number): number {
        const expr: QueryExpression = {
            type: "Average",
            args: [selector],
            source: this.expression
        };
        return this.provider.execute<number>(expr);
    }

    public min(selector: (item: T) => number): number {
        const expr: QueryExpression = {
            type: "Min",
            args: [selector],
            source: this.expression
        };
        return this.provider.execute<number>(expr);
    }

    public max(selector: (item: T) => number): number {
        const expr: QueryExpression = {
            type: "Max",
            args: [selector],
            source: this.expression
        };
        return this.provider.execute<number>(expr);
    }

    // Quantifiers
    public any(predicate?: (item: T) => boolean): boolean {
        const expr: QueryExpression = {
            type: "Any",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<boolean>(expr);
    }

    public all(predicate: (item: T) => boolean): boolean {
        const expr: QueryExpression = {
            type: "All",
            args: [predicate],
            source: this.expression
        };
        return this.provider.execute<boolean>(expr);
    }

    // Element operators
    public first(predicate?: (item: T) => boolean): T | null {
        const expr: QueryExpression = {
            type: "First",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<T | null>(expr);
    }

    public firstOrDefault(predicate?: (item: T) => boolean): T | null {
        const expr: QueryExpression = {
            type: "FirstOrDefault",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<T | null>(expr);
    }

    public single(predicate?: (item: T) => boolean): T | null {
        const expr: QueryExpression = {
            type: "Single",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<T | null>(expr);
    }

    public singleOrDefault(predicate?: (item: T) => boolean): T | null {
        const expr: QueryExpression = {
            type: "SingleOrDefault",
            args: predicate ? [predicate] : [],
            source: this.expression
        };
        return this.provider.execute<T | null>(expr);
    }

    // Convenience
    public find(predicate: (item: T) => boolean): T | null {
        const expr: QueryExpression = {
            type: "Find",
            args: [predicate],
            source: this.expression
        };
        return this.provider.execute<T | null>(expr);
    }

    // Conversion
    public toArray(): T[] {
        return this.provider.execute<T[]>(this.expression);
    }
}
