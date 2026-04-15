
# DbContext

1. **Walks up the prototype chain** of the entity constructor.
2. **Skips abstract classes** (those intended only as shared bases).
3. **Stops at the lowest non-abstract base class** — that’s the one we register in the `DbContext`.
4. **Resolution**: When we call `set(TestUser)`, it should walk up until it finds the registered non-abstract base (`IdentityUser`) and return that `DbSet`.

---

## Implementation idea

```ts
private findConcreteBaseCtor(entityCtor: Function): Function {
  let current = entityCtor;
  while (true) {
    const parent = Object.getPrototypeOf(current);
    if (!parent || parent === Function.prototype) break;

    // If parent is abstract, skip it and keep going
    if (Reflect.getMetadata("abstract", parent)) {
      current = parent;
      continue;
    }

    // If parent is not abstract, move up
    current = parent;
  }
  return current;
}

public register<TEntity extends BaseEntity>(
  entityCtor: new () => TEntity,
  primaryKey: PrimaryKey<TEntity>
): DbSet<TEntity> {
  const concreteBase = this.findConcreteBaseCtor(entityCtor);

  // Remove any derived registrations
  for (const existingCtor of this.registry.keys()) {
    if (entityCtor.prototype instanceof existingCtor ||
        existingCtor.prototype instanceof entityCtor) {
      this.registry.delete(existingCtor);
      this.database.delete(existingCtor);
    }
  }

  this.registry.set(concreteBase, primaryKey);
  if (!this.database.has(concreteBase)) {
    this.database.set(
      concreteBase,
      new DbSet<TEntity>(primaryKey, this.provider, { type: "Root", args: [] })
    );
  }
  return this.set(concreteBase as new () => TEntity);
}

protected resolveSet<TEntity extends BaseEntity>(
  entityCtor: new () => TEntity
): DbSet<TEntity> {
  let current: any = entityCtor;
  while (current && !this.registry.has(current)) {
    current = Object.getPrototypeOf(current);
  }
  if (!current) throw new Error(`Entity ${entityCtor.name} not registered`);
  return this.database.get(current)! as DbSet<TEntity>;
}
```

---

### How this works

- **Abstract base classes** (like `IdentityUserGeneric`) are skipped. We can mark them with metadata (`Reflect.defineMetadata("abstract", ctor, true)`) or a convention.
- **Concrete base class** (like `IdentityUser`) is the one registered.
- **Derived classes** (like `TestUser`) resolve back to the `IdentityUser` `DbSet`.
- This allows shared abstract bases for multiple entities without polluting the registry, while still giving derived services access.

---

✅ This way, our `DbContext` keeps **only the lowest non-abstract base class** in the registry, and derived entities automatically resolve to it.  

---

In TypeScript, the `abstract` keyword is **compile‑time only**. It enforces constraints at design time, but it does not survive into runtime JavaScript. Once compiled, an abstract class is just a normal constructor function. That’s why we can’t detect “abstractness” at runtime without adding our own marker.

So if we want to reliably skip abstract bases when walking the prototype chain, we need to **mark them ourself**.

---

### Clean example with `ctor` property

```ts
/// <summary>
/// Marker to indicate a class is abstract for DbContext resolution.
/// </summary>
export function AbstractEntity(): ClassDecorator {
  return (target: Function) => {
    Object.defineProperty(target, "__isAbstractEntity", {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });
  };
}

/// <summary>
/// Helper to check if a class is marked abstract.
/// </summary>
export function isAbstractEntity(target: Function): boolean {
  return (target as any).__isAbstractEntity === true;
}
```

---

### Usage

```ts
@AbstractEntity()
export abstract class IdentityUserGeneric {
  id!: string;
}

export class IdentityUser extends IdentityUserGeneric {
  username!: string;
}

export class TestUser extends IdentityUser {
  customField!: string;
}
```

---

### Integration with `findConcreteBaseCtor`

```ts
private findConcreteBaseCtor(entityCtor: Function): Function {
  let current = entityCtor;
  while (true) {
    const parent = Object.getPrototypeOf(current);
    if (!parent || parent === Function.prototype) break;

    // Skip abstract classes
    if (isAbstractEntity(parent)) {
      current = parent;
      continue;
    }

    current = parent;
  }
  return current;
}

public register<TEntity>(
    entityCtor: new () => TEntity,
    primaryKey: PrimaryKey<TEntity>
  ): DbSet<TEntity> {
    const concreteBase = this.findConcreteBaseCtor(entityCtor);

    this.registry.set(concreteBase, primaryKey);
    if (!this.database.has(concreteBase)) {
      this.database.set(concreteBase, new DbSet<TEntity>());
    }
    return this.set(concreteBase as new () => TEntity);
  }

  public set<TEntity>(entityCtor: new () => TEntity): DbSet<TEntity> {
    let current: any = entityCtor;
    while (current && !this.registry.has(current)) {
      current = Object.getPrototypeOf(current);
    }
    if (!current) throw new Error(`Entity ${entityCtor.name} not registered`);
    return this.database.get(current)! as DbSet<TEntity>;
  }

```

---

✅ This way:

- We mark abstract classes explicitly with `@AbstractEntity()`.
- At runtime, we can check `ctor.__isAbstractEntity`.
- Our registry logic can skip abstract bases and only keep the lowest non‑abstract base class.

---

We're walking **up** to find the lowest non-abstract base:

**Fixed logic — walk up, track the last non-abstract seen:**

```typescript
private findConcreteBaseCtor(entityCtor: Function): Function {
    let lowestConcrete: Function | null = null;
    let current = entityCtor;

    while (true) {
        const parent = Object.getPrototypeOf(current);

        // Stop at the top of the prototype chain
        if (!parent || parent === Function.prototype) break;

        if (!isAbstractEntity(current)) {
            // Track the lowest non-abstract class seen so far
            lowestConcrete = current;
        }

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
```

---

**Walkthrough with our hierarchy:**

```bash
UserEntity          → not abstract  ← lowestConcrete = UserEntity
  └─ AuditableEntity  → @AbstractEntity()
       └─ BaseEntity    → @AbstractEntity()
            └─ Function.prototype → stop
```

Result: `lowestConcrete = UserEntity` ✅

```bash
AdminEntity         → not abstract  ← lowestConcrete = AdminEntity  
  └─ UserEntity       → not abstract  ← lowestConcrete = UserEntity (overwritten going up)
       └─ BaseEntity    → @AbstractEntity()
            └─ stop
```

Result: `lowestConcrete = UserEntity` ✅ — shared DbSet with `UserEntity`, which is what we want for table-per-hierarchy.

---
