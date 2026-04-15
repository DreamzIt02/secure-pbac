import { randomUUID } from "../utils.js";
import { TypeDescriptor } from "./type.descriptor.js";

const ALLOWED_PRIMARY_KEYS = {
  string: 100,
  number: 20,
  bigint: 30,
// TODO: include "enum" and "guid" in primary keys (future)
} as const;

export type AllowedPrimaryKeys = keyof typeof ALLOWED_PRIMARY_KEYS;
export type AllowedPrimaryKeysSafe = string | number | bigint;
type AllowedPrimaryKeysTypeSafe = AllowedPrimaryKeys | Exclude<AllowedPrimaryKeysSafe, string>;

export const ABSTRACT_PROPERTY_KEY = "__isAbstractEntity";
/// <summary>
/// Marker to indicate a class is abstract for DbContext resolution.
/// </summary>
export function AbstractEntity(): ClassDecorator {
  return (target: Function | object) => {
    const ctor = typeof target === "function" ? target : target.constructor;
    Reflect.defineProperty(ctor, ABSTRACT_PROPERTY_KEY, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  };
}

/// <summary>
/// Helper to check if a class is marked abstract.
/// Accepts either a constructor or an instance.
/// </summary>
export function isAbstractEntity(target: Function | object): boolean {
  const ctor = typeof target === "function" ? target : target.constructor;
  const propertyDescriptor = Reflect.getOwnPropertyDescriptor(ctor, ABSTRACT_PROPERTY_KEY);
  return propertyDescriptor?.value === true;
}

// BaseEntity is now just a marker, not enforcing "id"
@AbstractEntity()
export abstract class BaseEntity {
    // marker class, no enforced id
}

/// <summary>
/// Example: A concrete entity extending BaseEntity.
/// Does NOT inherit the abstract marker — must be explicitly decorated.
/// </summary>
class UserEntity extends BaseEntity {
  id: number = 0;
  name: string = "";
}

/// <summary>
/// Example: An explicitly marked abstract intermediate entity.
/// </summary>
@AbstractEntity()
abstract class AuditableEntity extends BaseEntity {
  createdAt: Date = new Date();
}

/// <summary>
/// const pk1 = new PrimaryKey({ id: "abc" });   // ✅ ok
/// const pk2 = new PrimaryKey({ id: 123 });     // ✅ ok
/// const pk3 = new PrimaryKey({ id: 123n });    // ✅ ok
///
/// const pkBad = new PrimaryKey({ id: true });  // ❌ throws: Unsupported primary key type: boolean
/// </summary>
export class PrimaryKey<TEntity extends BaseEntity = BaseEntity> {
    private keys: { [key: string]: AllowedPrimaryKeys };
    private nextId: number = 1;

    constructor(
        keys: { [key: string]: AllowedPrimaryKeysTypeSafe },
        private readonly options: { auto?: boolean } = { auto: false },
    ) {
        const props = TypeDescriptor.getProperties(keys);
        for (const k in keys) {
            // Try to detect from defined key-type
            let keyType = keys[k] as AllowedPrimaryKeys;
            if (!(keyType in ALLOWED_PRIMARY_KEYS))
                keyType = props.find(k)?.typeName as AllowedPrimaryKeys         

            // Try to match either key type name or key type value
            if (!(keyType in ALLOWED_PRIMARY_KEYS))
                throw new Error(`Unsupported primary key type: ${keyType}`);

            // Re-assign detected key type
            keys[k] = keyType;
        }
        this.keys = keys as { [key: string]: AllowedPrimaryKeys };
    }

    public compare(e1: TEntity, e2: TEntity): boolean {
        for (const key in this.keys) {
            if (!(key in e1) || !(key in e2)) return false;
            // Match value
            if ((e1 as any)[key] !== (e2 as any)[key]) return false
        }
        return true
    }

    public resolve(entity: TEntity): TEntity {
        if (!this.options?.auto)
            return entity;

        for (const key in this.keys) {
            const keyType = this.keys[key];

            switch (keyType) {
                case "string":
                    (entity as any)[key] = randomUUID();
                    break;
                case "number":
                    (entity as any)[key] = this.nextId++;
                    break;
                case "bigint":
                    (entity as any)[key] = BigInt(this.nextId++);
                    break;
                default: {
                    // Exhaustiveness check
                    const _exhaustive: never = keyType;
                    throw new Error(`Unsupported primary key type: ${_exhaustive}`);
                }
            }
        }
        return entity;
    }
}
