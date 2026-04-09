import { HttpContext } from "../http.context.js";
import { AuthenticateResult } from "./authenticate.result.js";
import { AuthenticationProperties } from "./authentication.properties.js";
import { AuthenticationService } from "./authentication.service.js";
import { AuthenticationToken } from "./authentication.token.js";

const tokenNamesKey = ".TokenNames";
const tokenKeyPrefix = ".Token.";

/**
 * Extension methods for storing authentication tokens in AuthenticationProperties.
 * These are attached to the prototype so they can be called like real extensions.
 */
declare module "./authentication.properties.js" {
  interface AuthenticationProperties {
    storeTokens(tokens: AuthenticationToken[]): void;
    getTokenValue(tokenName: string): string | null;
    updateTokenValue(tokenName: string, tokenValue: string | null): boolean;
    getTokens(): AuthenticationToken[];
  }
}
/**
 * Stores a set of authentication tokens, after removing any old tokens.
 * @param properties The AuthenticationProperties properties.
 * @param tokens The tokens to store.
 */
AuthenticationProperties.prototype.storeTokens = function (tokens: AuthenticationToken[]): void {
  if (!this) throw new Error("properties cannot be null");
  if (!tokens) throw new Error("tokens cannot be null");

  // Clear old tokens first
  const oldTokens = this.getTokens();
  for (const t of oldTokens) {
    delete this.items[tokenKeyPrefix + t.name];
  }
  delete this.items[tokenNamesKey];

  const tokenNames: string[] = [];
  for (const token of tokens) {
    if (token.name == null) {
      throw new Error("Token name cannot be null for any token.");
    }
    tokenNames.push(token.name);
    this.items[tokenKeyPrefix + token.name] = token.value;
  }

  if (tokenNames.length > 0) {
    this.items[tokenNamesKey] = tokenNames.join(";");
  }
};

/**
 * Returns the value of a token.
 * @param properties The AuthenticationProperties properties.
 * @param tokenName The token name.
 * @returns The token value.
 */
AuthenticationProperties.prototype.getTokenValue = function (tokenName: string): string | null {
  if (!this) throw new Error("properties cannot be null");
  if (!tokenName) throw new Error("tokenName cannot be null");

  const tokenKey = tokenKeyPrefix + tokenName;
  return this.items[tokenKey] ?? null;
};

/**
 * Updates the value of a token if already present.
 * @param properties The AuthenticationProperties to update.
 * @param tokenName The token name.
 * @param tokenValue The token value. May be null.
 * @returns true if the token was updated, otherwise false.
 */
AuthenticationProperties.prototype.updateTokenValue = function (tokenName: string, tokenValue: string | null): boolean {
  if (!this) throw new Error("properties cannot be null");
  if (!tokenName) throw new Error("tokenName cannot be null");

  const tokenKey = tokenKeyPrefix + tokenName;
  if (!(tokenKey in this.items)) {
    return false;
  }
  this.items[tokenKey] = tokenValue ?? null;
  return true;
};
/**
 * Returns all of the AuthenticationToken instances contained in the properties.
 * @param properties The AuthenticationProperties properties.
 * @returns The authentication tokens.
 */
AuthenticationProperties.prototype.getTokens = function (): AuthenticationToken[] {
  if (!this) throw new Error("properties cannot be null");

  const tokens: AuthenticationToken[] = [];
  const value = this.items[tokenNamesKey];
  if (value && value.length > 0) {
    const tokenNames = value.split(";");
    for (const name of tokenNames) {
      const token = this.getTokenValue(name);
      if (token != null) {
        tokens.push({ name, value: token });
      }
    }
  }
  return tokens;
};

/**
 * Extension methods for IAuthenticationService.
 */
declare module "./authentication.service.js" {
  interface AuthenticationService extends IAuthenticationService {
    getTokenAsync(context: HttpContext, tokenName: string): Promise<string | null>;
    getTokenAsync(context: HttpContext, scheme: string | null, tokenName: string): Promise<string | null>;
  }
}

/**
 * Authenticates the request using the specified authentication scheme and returns the value for the token.
 * @param auth The IAuthenticationService.
 * @param context The HttpContext context.
 * @param scheme The name of the authentication scheme.
 * @param tokenName The name of the token.
 * @returns The value of the token if present.
 */
AuthenticationService.prototype.getTokenAsync = async function (
  context: HttpContext,
  arg2: string | null | undefined,
  arg3?: string
): Promise<string | null> {
  if (!this) throw new Error("auth cannot be null");

  if (typeof arg3 === "undefined") {
    // overload without scheme
    return this.getTokenAsync(context, null, arg2!);
  } else {
    // overload with scheme
    const result = await this.authenticateAsync(context, arg2 ?? null);
    return result?.properties ? result.properties.getTokenValue(arg3) : null;
  }
};

// ### ✅ What this gives us
// - We can now call:
//   ```ts
//   properties.storeTokens(tokens);
//   const value = properties.getTokenValue("access_token");
//   const tokens = properties.getTokens();
//   ```
// - And for the service:
//   ```ts
//   const token = await auth.getTokenAsync(context, "access_token");
//   ```
  