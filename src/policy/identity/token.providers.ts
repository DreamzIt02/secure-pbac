// Identity module: email/phone token providers

// Generic token provider interface
export interface IUserTokenProvider {
  name: string;
  tokenLifeSpanMinutes: number;
  generateToken(userId: string): string;
  validateToken(userId: string, token: string): boolean;
}

// Email token provider
export class EmailUserTokenProvider implements IUserTokenProvider {
  name = 'EmailUserToken';
  tokenLifeSpanMinutes: number;

  constructor(tokenLifeSpanMinutes = 1440) {
    this.tokenLifeSpanMinutes = tokenLifeSpanMinutes;
  }

  generateToken(userId: string): string {
    return `email-${userId}-${Date.now()}`;
  }

  validateToken(userId: string, token: string): boolean {
    return token.startsWith(`email-${userId}-`);
  }
}

// Phone token provider
export class PhoneUserTokenProvider implements IUserTokenProvider {
  name = 'PhoneUserToken';
  tokenLifeSpanMinutes: number;

  constructor(tokenLifeSpanMinutes = 1440) {
    this.tokenLifeSpanMinutes = tokenLifeSpanMinutes;
  }

  generateToken(userId: string): string {
    return `phone-${userId}-${Date.now()}`;
  }

  validateToken(userId: string, token: string): boolean {
    return token.startsWith(`phone-${userId}-`);
  }
}

// Identity builder extension equivalent
export class CustomIdentityBuilderExtensions {
  static EmailUserTokenProvider = 'EmailUserToken';
  static PhoneUserTokenProvider = 'PhoneUserToken';

  static addEmailUserTokenProvider(): EmailUserTokenProvider {
    return new EmailUserTokenProvider();
  }

  static addPhoneUserTokenProvider(): PhoneUserTokenProvider {
    return new PhoneUserTokenProvider();
  }
}
