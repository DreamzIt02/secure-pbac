# DBEntity

```typescript
/// <summary>
/// Marker to indicate a class is abstract for DbContext resolution.
/// </summary>
export function AbstractEntity(): ClassDecorator {
  return (target: Function) => {
    Object.defineProperty(target, "__isAbstractEntity", {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  };
}

/// <summary>
/// Helper to check if a class is marked abstract.
/// Accepts either a constructor or an instance.
/// </summary>
export function isAbstractEntity(target: Function | object): boolean {
  const ctor = typeof target === "function" ? target : target.constructor;
  return (ctor as any).__isAbstractEntity === true;
}

@AbstractEntity()
export abstract class BaseEntity {}

/// <summary>
/// Example: A concrete entity extending BaseEntity.
/// Does NOT inherit the abstract marker — must be explicitly decorated.
/// </summary>
export class UserEntity extends BaseEntity {
  id: number = 0;
  name: string = "";
}

/// <summary>
/// Example: An explicitly marked abstract intermediate entity.
/// </summary>
@AbstractEntity()
export abstract class AuditableEntity extends BaseEntity {
  createdAt: Date = new Date();
}
```

**Key design decisions explained:**

**`__isAbstractEntity` is NOT inherited** — it's defined directly on the constructor via `Object.defineProperty`, not on the prototype chain. This means:

```typescript
isAbstractEntity(BaseEntity)      // ✅ true  — decorated
isAbstractEntity(AuditableEntity) // ✅ true  — explicitly decorated
isAbstractEntity(UserEntity)      // ✅ false — not decorated, even though it extends BaseEntity
```

**`isAbstractEntity` accepts both constructors and instances** — so both of these work:

```typescript
isAbstractEntity(UserEntity)       // passing constructor
isAbstractEntity(new UserEntity()) // passing instance → resolves to UserEntity constructor
```

**Why `configurable: false, writable: false`** — prevents accidental override in subclasses or monkey-patching at runtime, making the abstract marker tamper-resistant.

If we want inheritance to propagate the abstract marker (i.e. subclasses of an abstract entity are also abstract unless explicitly opted out), we can change the check to walk the prototype chain:

```typescript
export function isAbstractEntity(target: Function | object): boolean {
  let ctor = typeof target === "function" ? target : target.constructor;
  while (ctor && ctor !== Function.prototype) {
    if (Object.prototype.hasOwnProperty.call(ctor, "__isAbstractEntity")) {
      return (ctor as any).__isAbstractEntity === true;
    }
    ctor = Object.getPrototypeOf(ctor);
  }
  return false;
}
```

---
