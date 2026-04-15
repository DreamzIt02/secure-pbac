import { IQueryable, IQueryProvider, Queryable, QueryExpression, DatabaseQueryable } from "../linq/index.js";
import { BaseEntity, PrimaryKey } from "./db.entity.js";


/// <summary>
/// Represents a typed collection of entities, similar to .NET DbSet.
/// 
/// ### Why this works
/// 
/// `DbSet<TEntity>` extends `Queryable<TEntity>` so it inherits all LINQ operators (`where`, `select`, `orderBy`, etc.).
/// 
/// It maintains its own `entities` array for CRUD operations.
///
/// It overrides `[Symbol.iterator]` so enumeration works directly on the internal store.
///
/// `asQueryable()` decides whether to return an in‑memory `Queryable<TEntity>` or a database‑backed `DatabaseQueryable<TEntity>` depending on whether a provider is injected.
///
/// `toArray()` materializes either from memory or via provider execution.
///
/// ✅ This way, our `DbSet<TEntity>` is **queryable by default** (like EF Core), while still supporting CRUD operations.
///
/// We don’t need to call `.asQueryable()` unless we want to explicitly switch between in‑memory and database pipelines.  
/// </summary>
export class DbSet<TEntity extends BaseEntity>
    extends Queryable<TEntity>
    implements IQueryable<TEntity>
{
    constructor(
        private readonly primaryKey: PrimaryKey,
        private readonly provider? : IQueryProvider,
        private readonly expression: QueryExpression = { type: "Root", args: [] },
        // IMPORTANT! This name (source) must match with the same name (source) from super (Queryable)
        // Otherwise TypeScripts create two distinct source or Entities 
        // For example, if we rename it to source1, then there will be source and source1 for this DbSet JSON Object
        protected readonly identifiers: string[] = [],
        protected source: TEntity[] = [],
    ) {
        super(source); // base Queryable initialized empty
        this.identifiers = [...new Set(identifiers)];
    }

    // IQueryable override
    *[Symbol.iterator](): Iterator<TEntity> {
        if (this.provider) {
            // Database-backed: materialize via provider
            const results = this.provider.execute<TEntity[]>(this.expression);
            yield* results;
        } else {
            // In-memory: iterate over local array
            yield* this.source;
        }
    }

    /// <summary>
    /// `DbSet<T>.asQueryable()` decides whether to return an **in‑memory generator pipeline** (`Queryable<T>`) 
    ///
    /// or a **database expression tree** (`DatabaseQueryable<T>`).
    ///
    /// Execution is deferred until we call `toArray()`, `first()`, `count()`, etc.
    /// </summary>
    public asQueryable(): Queryable<TEntity> | DatabaseQueryable<TEntity> {
        if (this.provider) {
            return new DatabaseQueryable<TEntity>(this.provider, this.expression);
        }
        return new Queryable<TEntity>(this.source);
    }

    public toArray(): TEntity[] {
        if (this.provider) {
            return this.provider.execute<TEntity[]>(this.expression);
        }
        return [...this.source];
    }

    // CRUD methods (add, update, remove, etc.)
    /// <summary>
    /// Creates a new entity in the set.
    /// </summary>
    public add(entity: TEntity): TEntity {
        entity = this.primaryKey.resolve(entity) as TEntity;
        if (this.provider) {
            // Database-backed: build an expression for INSERT
            this.provider.execute<TEntity>({
                type: "Insert",
                args: [entity],
                source: this.expression
            });
        } else {
            // In-memory: push into local array
            this.source.push(entity);
        }
        return entity;
    }

    /// <summary>
    /// Updates an existing entity.
    /// </summary>
    public update(entity: TEntity): void {
        if (this.provider) {
            // Database-backed: build an expression for UPDATE
            this.provider.execute<void>({
                type: "Update",
                args: [entity],
                source: this.expression
            });
        } else {
            const index = this.source.findIndex(e => this.primaryKey.compare(e, entity));
            if (index >= 0) {
                this.source[index] = entity;
            } else {
                throw new Error("Entity not found");
            }
        }
    }

    /// <summary>
    /// Deletes an entity.
    /// </summary>
    public remove(entity: TEntity): void {
        if (this.provider) {
            // Database-backed: build an expression for DELETE
            this.provider.execute<void>({
                type: "Delete",
                args: [entity],
                source: { type: "Root", args: [] }
            });
        } else {
            this.source = this.source.filter(e => !this.primaryKey.compare(e, entity));
        }
    }

    /// <summary>
    /// Attaches an entity to the set (adds if not already present).
    /// </summary>
    public attach(entity: TEntity): void {
        if (this.provider) {
            this.provider.execute<void>({
                type: "Attach",
                args: [entity],
                source: { type: "Root", args: [] }
            });
        } else {
            if (!this.source.includes(entity)) {
                entity = this.primaryKey.resolve(entity) as TEntity;
                this.source.push(entity);
            }
        }
    }

    
}
