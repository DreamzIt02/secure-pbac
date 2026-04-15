# TypeDescriptor

---

**Usage examples covering every new capability:**

```typescript
// ── convertFromString (fixed) ─────────────────────────────────────────────
TypeDescriptor.convertFromString("42",         "number")   // → 42
TypeDescriptor.convertFromString("true",       "boolean")  // → true
TypeDescriptor.convertFromString("9001n",      "bigint")   // → 9001n
TypeDescriptor.convertFromString("2024-06-01", "Date")     // → Date
TypeDescriptor.convertFromString(null,         "number")   // → null

// by sample
TypeDescriptor.convertFromString("42",   0)        // → 42
TypeDescriptor.convertFromString("true", false)    // → true

// ── convertToString (fixed) ───────────────────────────────────────────────
TypeDescriptor.convertToString(42n)          // → "42"
TypeDescriptor.convertToString(null)         // → null
TypeDescriptor.convertToString(new Date("2024-01-01")) // → "2024-01-01T00:00:00.000Z"

// ── getConverter ──────────────────────────────────────────────────────────
TypeDescriptor.getConverter("number")        // → "number"
TypeDescriptor.getConverter(new Date())      // → "Date"

// ── getProperties ─────────────────────────────────────────────────────────
const user = { name: "Alice", age: 30, active: true };

TypeDescriptor.addAttributes("User.age", new ReadOnlyAttribute(true));
TypeDescriptor.addAttributes("User.age", new DefaultValueAttribute(18));
TypeDescriptor.addAttributes("User.age", new CategoryAttribute("Profile"));
TypeDescriptor.addAttributes("User.name", new DisplayNameAttribute("Full name"));

const props = TypeDescriptor.getProperties(user);
props.count                              // → 3
props.find("age")?.typeName             // → "number"
props.find("age")?.isReadOnly           // → true
props.find("age")?.defaultValue         // → 18
props.find("age")?.category             // → "Profile"
props.find("name")?.displayName         // → "Full name"
props.find("active")?.typeName          // → "boolean"

props.find("age")?.canResetValue(user)  // → true  (30 ≠ default 18)
props.find("age")?.resetValue(user)     // throws: "Property age is read-only"

props.sort().getAll().map(p => p.name)  // → ["active", "age", "name"]
props.filter(p => !p.isReadOnly)        // → [name, active]

// ── instance-level attributes ────────────────────────────────────────────
const alice = { name: "Alice" };
TypeDescriptor.addInstanceAttributes(alice, new CategoryAttribute("VIP"));
TypeDescriptor.getInstanceAttributes(alice) // → [CategoryAttribute { category: "VIP" }]

// ── instance-level converter override ────────────────────────────────────
const token = { value: "2024-06-01" };
TypeDescriptor.setInstanceConverter(token, "Date");
TypeDescriptor.getInstanceConverter(token)   // → "Date"

// ── custom converter ──────────────────────────────────────────────────────
TypeDescriptor.registerConverter("URL", {
  detect:   (v): v is URL => v instanceof URL,
  convert:  (id) => new URL(id),
  toString: (v)  => v.href,
});
TypeDescriptor.convertFromString("https://example.com", "URL") // → URL
```

---

**Behavior:**

`TypeConverter.convert`: accept either an explicit `TypeName` literal or a sample value, and let `resolveTypeName` decide which path to take.

The additions mirror .NET's `TypeDescriptor` surface: `getConverter` maps to `TypeDescriptor.GetConverter`, `getProperties` reflects enumerable own properties and returns a `PropertyDescriptorCollection` with the full `getValue / setValue / canResetValue / resetValue / shouldSerializeValue` lifecycle, and the attribute system (`addAttributes / getAttributes / addInstanceAttributes / getInstanceAttributes`) provides the type- and instance-level metadata that .NET attaches via `Attribute` subclasses. The `setInstanceConverter / getInstanceConverter` pair mirrors .NET's component-level provider override, where a specific instance can declare it should be converted differently from its detected type.

---
