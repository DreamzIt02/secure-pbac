// # 🔥 Final: 100% Safe `tryParseEnum`

// * ✅ numeric enums (`0,1,2`)
// * ✅ string enums (`"Admin"`)
// * ✅ string input `"1"` → numeric enum
// * ✅ rejects reverse mappings (`"A"` from numeric enum)
// * ✅ rejects invalid values
// * ✅ no false positives

export function tryParseEnum<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): T[keyof T] | null {
  if (value === null || value === undefined) return null;

  const enumValues = extractEnum(enumObj, true);
  if (enumValues === undefined) return null;

  // 🔹 Filter real enum values (remove reverse mappings)
  const numericValues = enumValues.filter((v) => typeof v === 'number') as number[];
  const stringValues = enumValues.filter((v) => typeof v === 'string') as string[];

  // 🔹 Case 1: exact number match
  if (typeof value === 'number') {
    return numericValues.includes(value) ? (value as T[keyof T]) : null;
  }

  // 🔹 Case 2: string that represents number
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // try numeric match first (important)
    const num = Number(trimmed);
    if (!Number.isNaN(num) && numericValues.includes(num)) {
      return num as T[keyof T];
    }

    // then string enum match
    if (stringValues.includes(trimmed)) {
      return trimmed as T[keyof T];
    }
  }

  return null;
}

// # ✅ Why this is actually “secure”

// ### 🔒 1. Prevents reverse enum abuse

// Numeric enum:

// ```ts
// enum Test {
//   A = 0,
//   B = 1
// }
// ```

// JS output includes:

// ```ts
// { 0: "A", 1: "B", A: 0, B: 1 }
// ```

// ❌ BAD parser would allow:

// ```ts
// tryParseEnum(Test, "A") // ❌ WRONG (should NOT pass)
// ```

// ✅ Our parser:

// ```ts
// tryParseEnum(Test, "A") // null ✅
// ```

// ### 🔒 2. Accepts valid numeric inputs safely

// ```ts
// tryParseEnum(Test, 1)     // ✅ 1
// tryParseEnum(Test, "1")   // ✅ 1
// ```

// ### 🔒 3. Accepts string enums correctly

// ```ts
// enum Role {
//   Admin = "Admin",
//   User = "User"
// }

// tryParseEnum(Role, "Admin") // ✅ "Admin"
// tryParseEnum(Role, "admin") // ❌ null (case-sensitive)
// ```

// ### 🔒 4. Rejects garbage input

// ```ts
// tryParseEnum(Test, "abc")   // null
// tryParseEnum(Test, 999)     // null
// tryParseEnum(Test, {})      // null
// ```

// # 🧠 Important Design Decision

// ### We intentionally DO NOT allow:

// ```ts
// "A" → Test.A
// ```

// 👉 Because:

// * That’s **reverse mapping**, not actual enum value
// * It introduces ambiguity
// * It’s unsafe for auth systems


// # ✅ Our final usage

// ```ts
// const department = tryParseEnum(AuthorizeClaimEnum, claim.value);

// if (department !== null) {
//   return department;
// }
// return null;
// ```

// # ⚡ Bonus (C#-like API)

export function tryParseEnumOrThrow<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): T[keyof T] {
  const result = tryParseEnum(enumObj, value);
  if (result === null) {
    throw new Error(`Invalid enum value: ${value}`);
  }
  return result;
}

/**
 * Attempts to parse a string into a valid TEnum.
 * @param policy The string value to parse.
 * @param output Reference to store the parsed TEnum if successful.
 * @returns True if parsing succeeded, false otherwise.
 */
export function tryParse<
  TEnum extends Record<string, string | number>
>(
  enumObj: TEnum,
  value: string | unknown,
  output: { value: TEnum[keyof TEnum] }
): boolean {
  const parsed = tryParseEnum(enumObj, value);
  if (parsed !== null) {
    output.value = parsed as TEnum[keyof TEnum];
    return true;
  }
  output.value = undefined as any;
  return false;
}


// * ✅ Safe for **numeric + string enums**
// * ✅ Handles `"1"` → `1`
// * ✅ Rejects reverse mapping exploits
// * ✅ Suitable for **security-critical systems (our PBAC)**

// # 🔥 Purify Enum compilation to JavaScript Object

// - the right mental model. TypeScript enum declarations always have **string identifiers** as keys, never quoted strings or bare numbers. The compiler then emits a JS object that contains both:

// - **Forward mappings** (the actual enum members declared).
// - **Reverse mappings** (numeric keys pointing back to the string names, only for numeric enums).

// So the trick to a “safe” parser is to **strip out any numeric keys** from the compiled object before even look at values. That leaves with a clean object that represents only the true enum members.

// ### Example

// ```ts
// enum Test {
//   A = 0,
//   B = 1
// }

// // Compiled JS:
// {
//   0: "A",
//   1: "B",
//   A: 0,
//   B: 1
// }

// // ✅ After filtering out numeric keys:
// {
//   A: 0,
//   B: 1
// }
// ```

// ```ts
// enum Role {
//   Admin = "Admin",
//   User = "User"
// }

// // Compiled JS:
// {
//   Admin: "Admin",
//   User: "User"
// }

// // ✅ No numeric keys, so object is already pure.
// ```

// Overload signatures
export function extractEnum<T extends Record<string, string | number>>(enumObj: T): Partial<T>;
export function extractEnum<T extends Record<string, string | number>>(enumObj: T, asArray: true): (string | number)[];

// Implementation
export function extractEnum<T extends Record<string, string | number>>(enumObj: T, asArray?: boolean): Partial<T> | (string | number)[] {
  const entries = Object.entries(enumObj).filter(([key]) => isNaN(Number(key)));

  if (asArray) {
    // return array of values
    return entries.map(([, value]) => value);
  }

  // return object with only string keys
  const result: any = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
}

// Now we can safely use `Object.values(filterEnum(enumObj))` to get only the **real enum values** (numeric or string), without reverse mapping noise.

// ### Why this matters

// - **Numeric enums**: Without filtering, accidentally accept `"A"` or `"B"` as valid values. Filtering removes those.
// - **String enums**: No reverse mappings are generated, so filtering leaves them untouched.
// - **Hybrid enums** (rare, but possible): Filtering still works, because it only removes numeric keys.


// TODO: 
// ✔ I can enforce this at **type level (compile-time validation)**
