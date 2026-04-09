// Generic KeyValuePair equivalent
export interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}

// StringValues equivalent in TypeScript
export type StringValues = string | string[];

// Example usage
// export const pair: KeyValuePair<string, StringValues> = {
//   key: "Accept",
//   value: ["application/json", "text/html"]
// };

// console.log(pair.key, pair.value);
