import { describe, it, expect } from 'vitest';
import { EmailUserTokenProvider, PhoneUserTokenProvider, CustomIdentityBuilderExtensions } from '../../../src/policy/identity/index.js';

describe('EmailUserTokenProvider', () => {
  const provider = new EmailUserTokenProvider(60);

  it('should generate and validate token correctly', () => {
    const token = provider.generateToken('user1');
    expect(provider.validateToken('user1', token)).toBe(true);
  });

  it('should fail validation for wrong user', () => {
    const token = provider.generateToken('user1');
    expect(provider.validateToken('user2', token)).toBe(false);
  });

  it('should have correct name and lifespan', () => {
    expect(provider.name).toBe('EmailUserToken');
    expect(provider.tokenLifeSpanMinutes).toBe(60);
  });
});

describe('PhoneUserTokenProvider', () => {
  const provider = new PhoneUserTokenProvider(30);

  it('should generate and validate token correctly', () => {
    const token = provider.generateToken('user2');
    expect(provider.validateToken('user2', token)).toBe(true);
  });

  it('should fail validation for wrong user', () => {
    const token = provider.generateToken('user2');
    expect(provider.validateToken('user3', token)).toBe(false);
  });

  it('should have correct name and lifespan', () => {
    expect(provider.name).toBe('PhoneUserToken');
    expect(provider.tokenLifeSpanMinutes).toBe(30);
  });
});

describe('CustomIdentityBuilderExtensions', () => {
  it('should add email token provider', () => {
    const provider = CustomIdentityBuilderExtensions.addEmailUserTokenProvider();
    expect(provider).toBeInstanceOf(EmailUserTokenProvider);
  });

  it('should add phone token provider', () => {
    const provider = CustomIdentityBuilderExtensions.addPhoneUserTokenProvider();
    expect(provider).toBeInstanceOf(PhoneUserTokenProvider);
  });

  it('should expose provider names', () => {
    expect(CustomIdentityBuilderExtensions.EmailUserTokenProvider).toBe('EmailUserToken');
    expect(CustomIdentityBuilderExtensions.PhoneUserTokenProvider).toBe('PhoneUserToken');
  });
});
