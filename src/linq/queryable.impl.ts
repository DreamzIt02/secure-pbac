import { IQueryable } from "./queryable.js";

export class Queryable<T> implements IQueryable<T> {
    constructor(protected source: Iterable<T>) {}

    *[Symbol.iterator](): Iterator<T> {
        yield* this.source;
    }

    // Filtering
    public where(predicate: (item: T) => boolean): Queryable<T> {
        const self = this;
        function* gen() {
            for (const item of self.source) {
                if (predicate(item)) yield item;
            }
        }
        return new Queryable(gen());
    }

    public skip(count: number): Queryable<T> {
        const self = this;
        function* gen() {
            let i = 0;
            for (const item of self.source) {
                if (i++ >= count) yield item;
            }
        }
        return new Queryable(gen());
    }

    public take(count: number): Queryable<T> {
        const self = this;
        function* gen() {
            let i = 0;
            for (const item of self.source) {
                if (i++ < count) yield item;
                else break;
            }
        }
        return new Queryable(gen());
    }

    // Projection
    public select<U>(selector: (item: T) => U): Queryable<U> {
        const self = this;
        function* gen() {
            for (const item of self.source) {
                yield selector(item);
            }
        }
        return new Queryable(gen());
    }

    public selectMany<U>(selector: (item: T) => Iterable<U>): Queryable<U> {
        const self = this;
        function* gen() {
            for (const item of self.source) {
                for (const inner of selector(item)) {
                    yield inner;
                }
            }
        }
        return new Queryable(gen());
    }

    // Ordering (forces materialization)
    public orderBy<TKey>(keySelector: (item: T) => TKey): Queryable<T> {
        const arr = Array.from(this.source);
        arr.sort((a, b) => {
            const ka = keySelector(a);
            const kb = keySelector(b);
            return ka < kb ? -1 : ka > kb ? 1 : 0;
        });
        return new Queryable(arr);
    }

    public orderByDescending<TKey>(keySelector: (item: T) => TKey): Queryable<T> {
        const arr = Array.from(this.source);
        arr.sort((a, b) => {
            const ka = keySelector(a);
            const kb = keySelector(b);
            return ka > kb ? -1 : ka < kb ? 1 : 0;
        });
        return new Queryable(arr);
    }

    // Grouping
    public groupBy<TKey>(keySelector: (item: T) => TKey): Queryable<{ key: TKey; items: T[] }> {
        const map = new Map<TKey, T[]>();
        for (const item of this.source) {
            const key = keySelector(item);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        }
        const groups = Array.from(map.entries()).map(([key, items]) => ({ key, items }));
        return new Queryable(groups);
    }

    // Joining
    public join<U, K, R>(
        inner: IQueryable<U>,
        outerKeySelector: (item: T) => K,
        innerKeySelector: (item: U) => K,
        resultSelector: (outer: T, inner: U) => R
    ): Queryable<R> {
        const outerArr = Array.from(this.source);
        const innerArr = inner.toArray();
        const results: R[] = [];
        for (const o of outerArr) {
            const ok = outerKeySelector(o);
            for (const i of innerArr) {
                if (innerKeySelector(i) === ok) {
                    results.push(resultSelector(o, i));
                }
            }
        }
        return new Queryable(results);
    }

    // Aggregation (forces materialization)
    public count(predicate?: (item: T) => boolean): number {
        return predicate ? Array.from(this.source).filter(predicate).length : Array.from(this.source).length;
    }

    public sum(selector: (item: T) => number): number {
        return Array.from(this.source).reduce((acc, x) => acc + selector(x), 0);
    }

    public average(selector: (item: T) => number): number {
        const arr = Array.from(this.source);
        return arr.length === 0 ? 0 : arr.reduce((acc, x) => acc + selector(x), 0) / arr.length;
    }

    public min(selector: (item: T) => number): number {
        const arr = Array.from(this.source).map(selector);
        if (arr.length === 0) throw new Error("Sequence contains no elements");
        return Math.min(...arr);
    }

    public max(selector: (item: T) => number): number {
        const arr = Array.from(this.source).map(selector);
        if (arr.length === 0) throw new Error("Sequence contains no elements");
        return Math.max(...arr);
    }


    // Quantifiers
    public any(predicate?: (item: T) => boolean): boolean {
        for (const item of this.source) {
            if (!predicate || predicate(item)) return true;
        }
        return false;
    }

    public all(predicate: (item: T) => boolean): boolean {
        for (const item of this.source) {
            if (!predicate(item)) return false;
        }
        return true;
    }

    // Element operators
    public first(predicate?: (item: T) => boolean): T | null {
        for (const item of this.source) {
            if (!predicate || predicate(item)) return item;
        }
        return null;
    }

    public firstOrDefault(predicate?: (item: T) => boolean): T | null {
        return this.first(predicate);
    }

    public single(predicate?: (item: T) => boolean): T | null {
        const arr = predicate ? Array.from(this.source).filter(predicate) : Array.from(this.source);
        if (arr.length !== 1) throw new Error("Sequence does not contain exactly one element");
        return arr[0];
    }

    public singleOrDefault(predicate?: (item: T) => boolean): T | null {
        const arr = predicate ? Array.from(this.source).filter(predicate) : Array.from(this.source);
        if (arr.length > 1) throw new Error("Sequence contains more than one element");
        return arr.length === 1 ? arr[0] : null;
    }

    // Convenience
    public find(predicate: (item: T) => boolean): T | null {
        for (const item of this.source) {
            if (predicate(item)) return item;
        }
        return null;
    }

    // Conversion
    public toArray(): T[] {
        return Array.from(this.source);
    }
}
