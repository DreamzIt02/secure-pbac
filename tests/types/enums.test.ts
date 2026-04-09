import { describe, expect, it } from 'vitest';
import { tryParseEnum, tryParseEnumOrThrow } from '../../src/types/enums.js';

// Numeric enum
enum TestNum {
  A = 0,
  B = 1,
  C = 2,
}

// String enum
enum TestStr {
  Admin = 'Admin',
  User = 'User',
}

describe('tryParseEnum', () => {
  it('should return null for null/undefined', () => {
    expect(tryParseEnum(TestNum, null)).toBeNull();
    expect(tryParseEnum(TestNum, undefined)).toBeNull();
  });

  it('should parse exact numeric values', () => {
    expect(tryParseEnum(TestNum, 1)).toBe(1);
    expect(tryParseEnum(TestNum, 999)).toBeNull();
  });

  it('should parse string representing number', () => {
    expect(tryParseEnum(TestNum, '1')).toBe(1);
    expect(tryParseEnum(TestNum, '999')).toBeNull();
  });

  it('should parse string enum values', () => {
    expect(tryParseEnum(TestStr, 'Admin')).toBe('Admin');
    expect(tryParseEnum(TestStr, 'User')).toBe('User');
  });

  it('should reject case mismatch for string enums', () => {
    expect(tryParseEnum(TestStr, 'admin')).toBeNull();
  });

  it('should reject reverse mapping abuse', () => {
    // Numeric enum reverse mapping: "A" → 0 should NOT be allowed
    expect(tryParseEnum(TestNum, 'A')).toBeNull();
  });

  it('should reject garbage input', () => {
    expect(tryParseEnum(TestNum, {})).toBeNull();
    expect(tryParseEnum(TestNum, [])).toBeNull();
    expect(tryParseEnum(TestNum, 'abc')).toBeNull();
  });
});

describe('tryParseEnumOrThrow', () => {
  it('should return value when valid', () => {
    expect(tryParseEnumOrThrow(TestNum, 2)).toBe(2);
    expect(tryParseEnumOrThrow(TestStr, 'User')).toBe('User');
  });

  it('should throw error when invalid', () => {
    expect(() => tryParseEnumOrThrow(TestNum, 999)).toThrow('Invalid enum value: 999');
    expect(() => tryParseEnumOrThrow(TestStr, 'abc')).toThrow('Invalid enum value: abc');
  });
});
