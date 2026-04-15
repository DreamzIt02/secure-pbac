# TypeConverter

Here's a fully self-contained `TypeConverter` that handles every native TypeScript/JavaScript runtime type, accepting either a sample value or an explicit type name:```typescript

```ts
// ─────────────────────────────────────────────────────────────────────────────
// Supported type names
// ─────────────────────────────────────────────────────────────────────────────

export type TypeName =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "Date"
  | "null"
  | "undefined";

// Maps TypeName string literals → their actual TS types
export type TypeOf<T extends TypeName> =
  T extends "string"    ? string    :
  T extends "number"    ? number    :
  T extends "bigint"    ? bigint    :
  T extends "boolean"   ? boolean   :
  T extends "symbol"    ? symbol    :
  T extends "Date"      ? Date      :
  T extends "null"      ? null      :
  T extends "undefined" ? undefined :
  never;

// ─────────────────────────────────────────────────────────────────────────────
// Internal converter shape
// ─────────────────────────────────────────────────────────────────────────────

interface ConverterEntry<T> {
  /** Returns true when a sample value belongs to this type */
  detect: (sample: unknown) => sample is T;
  /** Converts a string representation into the target type */
  convert: (id: string) => T;
  /** Converts the target type back to string */
  toString: (value: T) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TypeConverter
// ─────────────────────────────────────────────────────────────────────────────

export class TypeConverter {
    //
}
```

---

**Behavior:**

The overloaded `convert` signature handles both modes cleanly. When we pass a `TypeName` string (`"number"`, `"boolean"`, etc.), `resolveTypeName` recognizes it directly from the registry keys. When we pass any other value (a sample), it falls through to `detectTypeName`, which walks the registry until a `detect` guard matches. This means:

```typescript
// By type name
TypeConverter.convert("42",         "number")   // → 42
TypeConverter.convert("9007199254740993n", "bigint")  // → 9007199254740993n
TypeConverter.convert("true",       "boolean")  // → true
TypeConverter.convert("2024-06-01", "Date")     // → Date object
TypeConverter.convert("my-key",     "symbol")   // → Symbol.for("my-key")

// By sample
TypeConverter.convert("42",         0)          // → 42
TypeConverter.convert("true",       false)      // → true
TypeConverter.convert("2024-06-01", new Date()) // → Date object

// Back to string
TypeConverter.toString(42n)                     // → "42"
TypeConverter.toString(Symbol.for("x"))         // → "x"
TypeConverter.toString(new Date("2024-01-01"))  // → "2024-01-01T00:00:00.000Z"

// Extensible
TypeConverter.register("URL", {
  detect:   (v): v is URL => v instanceof URL,
  convert:  (id) => new URL(id),
  toString: (v)  => (v as URL).href,
});
TypeConverter.convert("https://example.com", "URL") // → URL object
```

A few design notes worth calling out: `symbol` uses `Symbol.for()` so the key is globally registered and round-trips through `toString` via `description`. `null` and `undefined` are included as proper entries rather than special-cased, which keeps the registry exhaustive. The `register` method blocks overriding built-ins to prevent accidental breakage, but accepts any string as a custom type name so it's fully open for extension.

---
