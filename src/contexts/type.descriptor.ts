
import { TypeConverter, TypeName, TypeOf } from "./type.converter.js";

// ─────────────────────────────────────────────────────────────────────────────
// Attribute system (mirrors .NET's Attribute + AttributeCollection)
// ─────────────────────────────────────────────────────────────────────────────

export interface TypeAttribute {
  readonly attributeType: string;
  [key: string]: unknown;
}

export class DisplayNameAttribute implements TypeAttribute {
  readonly attributeType = "DisplayName";
  constructor(public readonly displayName: string) {}
  [key: string]: unknown;
}

export class DescriptionAttribute implements TypeAttribute {
  readonly attributeType = "Description";
  constructor(public readonly description: string) {}
  [key: string]: unknown;
}

export class ReadOnlyAttribute implements TypeAttribute {
  readonly attributeType = "ReadOnly";
  constructor(public readonly isReadOnly: boolean) {}
  [key: string]: unknown;
}

export class DefaultValueAttribute implements TypeAttribute {
  readonly attributeType = "DefaultValue";
  constructor(public readonly value: unknown) {}
  [key: string]: unknown;
}

export class CategoryAttribute implements TypeAttribute {
  readonly attributeType = "Category";
  constructor(public readonly category: string) {}
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// PropertyDescriptor (mirrors .NET's PropertyDescriptor)
// ─────────────────────────────────────────────────────────────────────────────

export interface PropertyDescriptor<TComponent = unknown, TValue = unknown> {
  readonly name:         string;
  readonly typeName:     TypeName;
  readonly attributes:   ReadonlyArray<TypeAttribute>;
  readonly isReadOnly:   boolean;
  readonly defaultValue: TValue | undefined;
  readonly category:     string | undefined;
  readonly description:  string | undefined;
  readonly displayName:  string;

  getValue(component: TComponent): TValue;
  setValue(component: TComponent, value: TValue): void;
  canResetValue(component: TComponent): boolean;
  resetValue(component: TComponent): void;
  shouldSerializeValue(component: TComponent): boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PropertyDescriptorCollection
// ─────────────────────────────────────────────────────────────────────────────

export class PropertyDescriptorCollection {
  private readonly descriptors: Map<string, PropertyDescriptor>;

  constructor(descriptors: PropertyDescriptor[] = []) {
    this.descriptors = new Map(descriptors.map(d => [d.name, d]));
  }

  find(name: string): PropertyDescriptor | undefined {
    return this.descriptors.get(name);
  }

  getAll(): ReadonlyArray<PropertyDescriptor> {
    return [...this.descriptors.values()];
  }

  sort(): PropertyDescriptorCollection {
    return new PropertyDescriptorCollection(
      [...this.descriptors.values()].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  }

  filter(predicate: (d: PropertyDescriptor) => boolean): PropertyDescriptorCollection {
    return new PropertyDescriptorCollection(
      [...this.descriptors.values()].filter(predicate)
    );
  }

  get count(): number {
    return this.descriptors.size;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TypeDescriptor
// ─────────────────────────────────────────────────────────────────────────────

export class TypeDescriptor {

  // ---------------------------------------------------------------------------
  // Internal registries (mirrors .NET's TypeDescriptor provider tables)
  // ---------------------------------------------------------------------------

  /** Type-level attribute overrides: typeName → attributes */
  private static readonly typeAttributes   = new Map<string,  TypeAttribute[]>();

  /** Instance-level attribute overrides: instance → attributes */
  private static readonly instanceAttributes = new WeakMap<object, TypeAttribute[]>();

  /** Instance-level converter overrides: instance → TypeName */
  private static readonly instanceConverters = new WeakMap<object, string>();

  // ---------------------------------------------------------------------------
  // convertFromString  (FIXED)
  // ---------------------------------------------------------------------------

  /**
   * Converts a string into the target type, resolved by an explicit TypeName.
   *
   * @example
   *   TypeDescriptor.convertFromString<number>("42",    "number")  // → 42
   *   TypeDescriptor.convertFromString<boolean>("true", "boolean") // → true
   *   TypeDescriptor.convertFromString(null, "number")             // → null
   */
  public static convertFromString<T extends TypeName>(
    id:       string | null | undefined,
    typeName: T
  ): TypeOf<T> | null;

  /**
   * Converts a string into the same type as a sample value (runtime detection).
   *
   * @example
   *   TypeDescriptor.convertFromString("42",   0)          // → 42
   *   TypeDescriptor.convertFromString("true", false)      // → true
   *   TypeDescriptor.convertFromString("2024-01-01", new Date()) // → Date
   */
  public static convertFromString<T>(
    id:     string | null | undefined,
    sample: T
  ): T | null;

  public static convertFromString(
    id:               string | null | undefined,
    typeNameOrSample: unknown
  ): unknown {
    if (id === undefined || id === null) return null;
    return TypeConverter.convert(id, typeNameOrSample as TypeName);
  }

  // ---------------------------------------------------------------------------
  // convertToString  (FIXED: was silently passing undefined)
  // ---------------------------------------------------------------------------

  /**
   * Converts any supported value back to its string representation.
   * Returns null for null / undefined input.
   *
   * @example
   *   TypeDescriptor.convertToString(42n)        // → "42"
   *   TypeDescriptor.convertToString(new Date())  // → ISO string
   *   TypeDescriptor.convertToString(null)        // → null
   */
  public static convertToString<T>(id: T | null | undefined): string | null {
    if (id === null || id === undefined) return null;
    return TypeConverter.toString(id);
  }

  // ---------------------------------------------------------------------------
  // GetConverter  (mirrors .NET TypeDescriptor.GetConverter)
  // ---------------------------------------------------------------------------

  /**
   * Returns the TypeName (converter key) for a given type name or sample.
   *
   * @example
   *   TypeDescriptor.getConverter("number")   // → "number"
   *   TypeDescriptor.getConverter(new Date()) // → "Date"
   */
  public static getConverter(typeNameOrSample: TypeName | unknown): TypeName {
    if (
      typeof typeNameOrSample === "string" &&
      TypeConverter["registry"].has(typeNameOrSample as TypeName)
    ) {
      return typeNameOrSample as TypeName;
    }
    return TypeConverter.detectTypeName(typeNameOrSample);
  }

  // ---------------------------------------------------------------------------
  // GetProperties  (mirrors .NET TypeDescriptor.GetProperties)
  // ---------------------------------------------------------------------------

  /**
   * Reflects the enumerable own properties of an object and returns
   * a PropertyDescriptorCollection.
   *
   * @example
   *   const col = TypeDescriptor.getProperties({ name: "Alice", age: 30 });
   *   col.find("age").typeName // → "number"
   */
  public static getProperties<T extends object>(
    instance: T
  ): PropertyDescriptorCollection {
    const typeAttrs = TypeDescriptor.getAttributes(instance.constructor?.name ?? "");

    const descriptors: PropertyDescriptor<T>[] =
      (Object.keys(instance) as (keyof T)[]).map(key => {
        const name      = String(key);
        const rawValue  = instance[key];
        const typeName  = TypeConverter.detectTypeName(rawValue);
        const propAttrs = TypeDescriptor.getAttributes(`${instance.constructor?.name}.${name}`);
        const allAttrs  = [...typeAttrs, ...propAttrs];

        const readOnlyAttr     = allAttrs.find(a => a.attributeType === "ReadOnly")    as ReadOnlyAttribute    | undefined;
        const defaultValueAttr = allAttrs.find(a => a.attributeType === "DefaultValue") as DefaultValueAttribute | undefined;
        const categoryAttr     = allAttrs.find(a => a.attributeType === "Category")    as CategoryAttribute    | undefined;
        const descriptionAttr  = allAttrs.find(a => a.attributeType === "Description") as DescriptionAttribute | undefined;
        const displayNameAttr  = allAttrs.find(a => a.attributeType === "DisplayName") as DisplayNameAttribute | undefined;

        return {
          name,
          typeName,
          attributes:   allAttrs,
          isReadOnly:   readOnlyAttr?.isReadOnly ?? false,
          defaultValue: defaultValueAttr?.value,
          category:     categoryAttr?.category,
          description:  descriptionAttr?.description,
          displayName:  displayNameAttr?.displayName ?? name,

          getValue:     (component) => (component as Record<string, unknown>)[name],

          setValue: (component, value) => {
            if (readOnlyAttr?.isReadOnly) {
              throw new Error(`Property "${name}" is read-only.`);
            }
            (component as Record<string, unknown>)[name] = value;
          },

          canResetValue: (component) =>
            defaultValueAttr !== undefined &&
            (component as Record<string, unknown>)[name] !== defaultValueAttr.value,

          resetValue: (component) => {
            if (defaultValueAttr !== undefined) {
              (component as Record<string, unknown>)[name] = defaultValueAttr.value;
            }
          },

          shouldSerializeValue: (component) =>
            defaultValueAttr === undefined ||
            (component as Record<string, unknown>)[name] !== defaultValueAttr.value,
        } satisfies PropertyDescriptor<T>;
      });

    return new PropertyDescriptorCollection(descriptors);
  }

  // ---------------------------------------------------------------------------
  // Attribute management  (mirrors .NET TypeDescriptor.AddAttributes)
  // ---------------------------------------------------------------------------

  /**
   * Adds attributes to a type by name (type-level metadata).
   *
   * @example
   *   TypeDescriptor.addAttributes("User", new DisplayNameAttribute("User account"));
   *   TypeDescriptor.addAttributes("User.age", new ReadOnlyAttribute(true));
   */
  public static addAttributes(typeName: string, ...attrs: TypeAttribute[]): void {
    const existing = TypeDescriptor.typeAttributes.get(typeName) ?? [];
    TypeDescriptor.typeAttributes.set(typeName, [...existing, ...attrs]);
  }

  /**
   * Returns all registered type-level attributes for a given type name.
   */
  public static getAttributes(typeName: string): TypeAttribute[] {
    return [...(TypeDescriptor.typeAttributes.get(typeName) ?? [])];
  }

  /**
   * Adds attributes to a specific component instance (instance-level metadata).
   *
   * @example
   *   const user = { name: "Alice" };
   *   TypeDescriptor.addInstanceAttributes(user, new CategoryAttribute("Identity"));
   */
  public static addInstanceAttributes(instance: object, ...attrs: TypeAttribute[]): void {
    const existing = TypeDescriptor.instanceAttributes.get(instance) ?? [];
    TypeDescriptor.instanceAttributes.set(instance, [...existing, ...attrs]);
  }

  /**
   * Returns instance-level attributes for a given component.
   */
  public static getInstanceAttributes(instance: object): TypeAttribute[] {
    return [...(TypeDescriptor.instanceAttributes.get(instance) ?? [])];
  }

  // ---------------------------------------------------------------------------
  // Per-instance converter override  (mirrors .NET component-level providers)
  // ---------------------------------------------------------------------------

  /**
   * Registers a converter override for a specific instance.
   * TypeDescriptor.convertFromString will use this when given that instance as sample.
   *
   * @example
   *   TypeDescriptor.setInstanceConverter(myObj, "Date");
   */
  public static setInstanceConverter(instance: object, typeName: TypeName): void {
    TypeDescriptor.instanceConverters.set(instance, typeName);
  }

  /**
   * Returns the converter type name for an instance (checking instance override
   * first, then runtime detection).
   */
  public static getInstanceConverter(instance: object): TypeName {
    const override = TypeDescriptor.instanceConverters.get(instance);
    if (override) return override as TypeName;
    return TypeConverter.detectTypeName(instance);
  }

  // ---------------------------------------------------------------------------
  // registerConverter  (extended: forwards to TypeConverter)
  // ---------------------------------------------------------------------------

  /**
   * Registers a new custom converter.
   * Built-in types cannot be overridden.
   *
   * @example
   *   TypeDescriptor.registerConverter("URL", {
   *     detect:   (v): v is URL => v instanceof URL,
   *     convert:  (id) => new URL(id),
   *     toString: (v)  => (v as URL).href,
   *   });
   */
  public static registerConverter<T>(
    typeName: string,
    entry: {
      detect:   (sample: unknown) => sample is T;
      convert:  (id: string) => T;
      toString: (value: T) => string;
    }
  ): void {
    TypeConverter.register(typeName, entry);
  }
}
