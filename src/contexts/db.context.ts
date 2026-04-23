// db.context.ts

import { CancellationToken } from "../types/cancellation.js";
import { DbSet } from "./db.set.js";
import { AllowedPrimaryKeys, BaseEntity, isAbstractEntity, PrimaryKey } from "./db.entity.js";
import { IQueryProvider } from "../linq/index.js";

// Example entities
export class User extends BaseEntity {
    id!: string;   // simple key
    text: string = "";
}

export class Book extends BaseEntity {
    isbn!: string; // complex key (not "id")
    title: string = "";
}

// IdentityUserRole uses composite key
export class UserRole<TKey> {
    userId!: TKey;
    roleId!: TKey;
}

export class DbConnection {

}

export class DbContextOptions {
    constructor();
    constructor(options: DbContextOptions);
    constructor(public readonly options?: DbContextOptions) {

    }
}

export abstract class DbContextOptionsBuilder {

}

export class ModelBuilder {

}

export abstract class DbContext<TOptions extends DbContextOptions = DbContextOptions>  {
    protected readonly registry = new Map<Function, PrimaryKey<any>>();
    protected readonly database = new Map<Function, DbSet<any>>();
    protected provider?: IQueryProvider;
    /**
     *
     */
    constructor(protected readonly options?: TOptions) {
        this.onConfiguring(options);
        this.onModelCreating();
    }

    /// Called when the context is being configured
    protected onConfiguring(builder?: DbContextOptionsBuilder | DbContextOptions): void {
        // Example: configure provider, logging, etc.
        console.log("DbContext configured.");
    }

    /// Called to build the model (entity sets, keys, relationships)
    protected onModelCreating(builder?: ModelBuilder): void {
        // Example: register entities and primary keys
        // this.register(User, new PrimaryKey({ id: "" }, { auto: true }));
        // this.register(Book, new PrimaryKey({ isbn: "" }));
        console.log("Model created.");
    }

    public ensureCreated(): boolean {
        return this.database.size > 0;
    }

    /// <summary>
    /// Register a DbSet for the given entity type.
    /// </summary>
    public register<TEntity extends BaseEntity = BaseEntity>(
        entityCtor: new () => TEntity,
        primaryKey: PrimaryKey<TEntity>
    ): DbSet<TEntity> {
        const concreteBase = this.findConcreteBaseCtor(entityCtor);
        const dbSet        = new DbSet<TEntity>(primaryKey, this.provider, { type: "Root", args: [] }, [entityCtor.name, concreteBase.name]);
        // Reflect.defineProperty(dbSet, "__entity_identity_name", {
        //     value: concreteBase.name,
        //     writable: false,
        //     enumerable: false,
        //     configurable: false,
        // })

        this.registry.set(concreteBase, primaryKey);
        // if (!this.database.has(concreteBase))
        // We allowed override to ensure the latest primary key is registered
        // Otherwise the the first register of the entity will keep its primaryKey and other configuration
        // While the inherited class could change the options, such as primaryKey
        this.database.set(concreteBase, dbSet);

        return this.set(concreteBase as new () => TEntity) ?? null as any;
    }

    /// <summary>
    /// Returns a DbSet for the given entity type.
    /// </summary>
    public set<TEntity extends BaseEntity>(entityCtor: new () => TEntity): DbSet<TEntity> {
        const concreteBase = this.findConcreteBaseCtor(entityCtor);
        const pk = this.registry.get(concreteBase);
        if (!pk) throw new Error(`Entity ${entityCtor.name} not registered`);
        const dbSet = this.database.get(concreteBase) as DbSet<TEntity>;
        if (!dbSet) throw new Error(`Entity ${entityCtor.name} not registered`);
        return dbSet;
    }

    /// <summary>
    /// Adds an entity to the correct DbSet.
    /// </summary>
    public add<TEntity extends BaseEntity>(entity: TEntity): TEntity {
        return this.resolveSet(entity.constructor as new () => TEntity).add(entity);
    }

    /// <summary>
    /// Updates an entity in the correct DbSet.
    /// </summary>
    public update<TEntity extends BaseEntity>(entity: TEntity): void {
        this.resolveSet(entity.constructor as new () => TEntity).update(entity);
    }

    /// <summary>
    /// Attaches an entity to the correct DbSet.
    /// </summary>
    public attach<TEntity extends BaseEntity>(entity: TEntity): void {
        this.resolveSet(entity.constructor as new () => TEntity).attach(entity);
    }

    /// <summary>
    /// Removes an entity from the correct DbSet.
    /// </summary>
    public remove<TEntity extends BaseEntity>(entity: TEntity): void {
        this.resolveSet(entity.constructor as new () => TEntity).remove(entity);
    }

    /// <summary>
    /// Persists all changes to the underlying store.
    /// </summary>
    public async saveChangesAsync(cancellationToken: CancellationToken): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        console.log("Changes saved to database.");
    }

    /// <summary>
    /// Resolves the correct DbSet based on runtime type.
    /// </summary>
    protected resolveSet<TEntity extends BaseEntity>(
        entityCtor: new () => TEntity,
    ): DbSet<TEntity> {
        return this.set(entityCtor);
    }

    private findConcreteBaseCtor(entityCtor: Function): Function {
        let lowestConcrete: Function | null = null;
        let current = entityCtor;

        while (true) {
            if (!isAbstractEntity(current)) {
                // Track the lowest non-abstract class seen so far
                lowestConcrete = current;
            }

            const parent = Object.getPrototypeOf(current);
            // Stop at the top of the prototype chain
            if (!parent || parent === Function.prototype) break;

            current = parent;
        }

        if (!lowestConcrete) {
            throw new Error(
                `No concrete (non-abstract) base class found for ${entityCtor.name}. ` +
                `Ensure at least one class in the hierarchy is not marked @AbstractEntity.`
            );
        }

        return lowestConcrete;
    }
}

/// <summary>
/// Represents a session with the database, similar to .NET DbContext.
/// </summary>
export class DbContext1 extends DbContext {

    public Users!: DbSet<User>;
    public Books!: DbSet<Book>;

    protected override onModelCreating(): void {
        this.Users = this.register(User, new PrimaryKey<User>({ id: "string" }, { auto: true }));
        this.Books = this.register(Book, new PrimaryKey<Book>({ isbn: "" as AllowedPrimaryKeys }, { auto: true })); // Key Type resolves to string
    }

    /// <summary>
    /// Persists all changes to the underlying store.
    /// </summary>
    public override async saveChangesAsync(cancellationToken: CancellationToken): Promise<void> {
        cancellationToken.throwIfCancellationRequested();
        // Inject custom task, before changes applied to the DbContext
        await super.saveChangesAsync(cancellationToken)
    }
}
