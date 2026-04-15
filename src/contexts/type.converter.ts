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

  // ---------------------------------------------------------------------------
  // Built-in converters (covers every native TS/JS primitive + Date)
  // ---------------------------------------------------------------------------

  private static readonly registry = new Map<TypeName, ConverterEntry<unknown>>([

    ["string", {
      detect:   (v): v is string  => typeof v === "string",
      convert:  (id)              => id,
      toString: (v)               => v as string,
    }],

    ["number", {
      detect:   (v): v is number  => typeof v === "number",
      convert:  (id) => {
        const n = Number(id);
        if (Number.isNaN(n)) throw new TypeError(`Cannot convert "${id}" to number`);
        return n;
      },
      toString: (v) => String(v),
    }],

    ["bigint", {
      detect:   (v): v is bigint  => typeof v === "bigint",
      convert:  (id) => {
        try { return BigInt(id); }
        catch { throw new TypeError(`Cannot convert "${id}" to bigint`); }
      },
      toString: (v) => String(v),
    }],

    ["boolean", {
      detect:   (v): v is boolean => typeof v === "boolean",
      convert:  (id) => {
        if (id === "true"  || id === "1") return true;
        if (id === "false" || id === "0") return false;
        throw new TypeError(`Cannot convert "${id}" to boolean — use "true"/"false"/"1"/"0"`);
      },
      toString: (v) => String(v),
    }],

    ["symbol", {
      detect:   (v): v is symbol  => typeof v === "symbol",
      // Symbol.for() gives a globally registered, round-trippable symbol.
      // Plain Symbol() is anonymous and cannot be reconstructed from a string.
      convert:  (id)              => Symbol.for(id),
      toString: (v)               => (v as symbol).description ?? "",
    }],

    ["Date", {
      detect:   (v): v is Date    => v instanceof Date,
      convert:  (id) => {
        const d = new Date(id);
        if (isNaN(d.getTime())) throw new TypeError(`Cannot convert "${id}" to Date`);
        return d;
      },
      toString: (v) => (v as Date).toISOString(),
    }],

    ["null", {
      detect:   (v): v is null    => v === null,
      convert:  (id) => {
        if (id === "null" || id === "") return null;
        throw new TypeError(`Cannot convert "${id}" to null — use "null" or ""`);
      },
      toString: () => "null",
    }],

    ["undefined", {
      detect:   (v): v is undefined => v === undefined,
      convert:  (id) => {
        if (id === "undefined" || id === "") return undefined;
        throw new TypeError(`Cannot convert "${id}" to undefined — use "undefined" or ""`);
      },
      toString: () => "undefined",
    }],

  ] as [TypeName, ConverterEntry<unknown>][]);

// ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Convert a string to the target type identified by a type-name literal.
   *
   * @example
   *   TypeConverter.convert("42",   "number")  // → 42
   *   TypeConverter.convert("true", "boolean") // → true
   *   TypeConverter.convert("2024-01-01", "Date") // → Date object
   */
  public static convert<T extends TypeName>(
    id: string,
    typeName: T
  ): TypeOf<T>;

  /**
   * Convert a string to the same type as a given sample value (type detected
   * at runtime via the registry's detect functions).
   *
   * @example
   *   TypeConverter.convert("42", 0)          // → 42  (number)
   *   TypeConverter.convert("hello", "")      // → "hello" (string)
   *   TypeConverter.convert("true", false)    // → true (boolean)
   *   TypeConverter.convert("2024-01-01", new Date()) // → Date
   */
  public static convert<T>(id: string, sample: T): T;

  // Implementation
  public static convert(id: string, typeNameOrSample: TypeName | unknown): unknown {
    const typeName = TypeConverter.resolveTypeName(typeNameOrSample);
    const entry    = TypeConverter.registry.get(typeName);

    if (!entry) 
      throw new TypeError(
        `No converter registered for type: "${typeName}". ` +
        `Registered types: ${[...TypeConverter.registry.keys()].join(", ")}`
      );

    return entry.convert(id);
  }

  /**
   * Convert any supported value back to its string representation.
   *
   * @example
   *   TypeConverter.toString(42n)       // → "42"
   *   TypeConverter.toString(new Date("2024-01-01")) // → "2024-01-01T00:00:00.000Z"
   *   TypeConverter.toString(Symbol.for("x"))        // → "x"
   */
  public static toString<T>(value: T): string {
    const typeName = TypeConverter.detectTypeName(value);
    const entry    = TypeConverter.registry.get(typeName);
    if (!entry) return String(value); // final fallback
    return (entry.toString as (v: unknown) => string)(value);
  }

  /**
   * Detect the TypeName of any value.
   *
   * @example
   *   TypeConverter.detectTypeName(42n)  // → "bigint"
   *   TypeConverter.detectTypeName(null) // → "null"
   */
  public static detectTypeName(sample: unknown): TypeName {
    for (const [typeName, entry] of TypeConverter.registry) {
      if (entry.detect(sample)) return typeName;
    }
    throw new TypeError(`Cannot detect type for sample: ${String(sample)}`);
  }

  /**
   * Register a custom converter for a new type name.
   * Built-in types cannot be overridden.
   *
   * @example
   *   TypeConverter.register("URL", {
   *     detect:   (v) => v instanceof URL,
   *     convert:  (id) => new URL(id),
   *     toString: (v)  => (v as URL).href,
   *   });
   */
  public static register<T>(
    typeName: string,
    entry: ConverterEntry<T>
  ): void {
    if (TypeConverter.registry.has(typeName as TypeName)) {
      throw new Error(
        `Cannot override built-in converter for "${typeName}". ` +
        `Use a distinct type name.`
      );
    }
    TypeConverter.registry.set(
      typeName as TypeName,
      entry as ConverterEntry<unknown>
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Resolves a TypeName string or a sample value into a TypeName */
  private static resolveTypeName(typeNameOrSample: TypeName | unknown): TypeName {
    // If it's a known type-name string literal, use it directly
    if (
      typeof typeNameOrSample === "string" &&
      TypeConverter.registry.has(typeNameOrSample as TypeName)
    ) {
      return typeNameOrSample as TypeName;
    }
    // Otherwise treat it as a sample and detect
    return TypeConverter.detectTypeName(typeNameOrSample);
  }
}
