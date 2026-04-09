/**
 * Dictionary used to store state values about the authentication session.
 *
 * This class encapsulates both persistent state values (`items`) and transient parameters (`parameters`)
 * associated with an authentication session. It provides helpers for working with strings, booleans,
 * and date-time values in a consistent format.
 *
 * Example usage:
 * ```ts
 * const props = new AuthenticationProperties();
 * props.isPersistent = true;
 * props.redirectUri = "https://example.com/callback";
 * props.issuedUtc = new Date();
 * console.log(props.clone());
 * ```
 */
export class AuthenticationProperties {
  private static readonly IssuedUtcKey = ".issued";
  private static readonly ExpiresUtcKey = ".expires";
  private static readonly IsPersistentKey = ".persistent";
  private static readonly RedirectUriKey = ".redirect";
  private static readonly RefreshKey = ".refresh";
  private static readonly UtcDateTimeFormat = "r"; // RFC1123 pattern

  /**
   * State values about the authentication session.
   */
  public items: Record<string, string | null>;

  /**
   * Collection of parameters that are passed to the authentication handler.
   * These are not intended for serialization or persistence, only for flowing data between call sites.
   */
  public parameters: Record<string, object | null>;

  /**
   * Initializes a new instance of the `AuthenticationProperties` class.
   */
  constructor(items?: Record<string, string | null>, parameters?: Record<string, object | null>) {
    this.items = items ?? {};
    this.parameters = parameters ?? {};
  }

  /**
   * Return a copy.
   * @returns A deep copy of the current `AuthenticationProperties`.
   */
  clone(): AuthenticationProperties {
    return new AuthenticationProperties({ ...this.items }, { ...this.parameters });
  }

  /**
   * Gets or sets whether the authentication session is persisted across multiple requests.
   */
  get isPersistent(): boolean {
    return this.getString(AuthenticationProperties.IsPersistentKey) != null;
  }
  set isPersistent(value: boolean) {
    this.setString(AuthenticationProperties.IsPersistentKey, value ? "" : null);
  }

  /**
   * Gets or sets the full path or absolute URI to be used as an http redirect response value.
   */
  get redirectUri(): string | null {
    return this.getString(AuthenticationProperties.RedirectUriKey);
  }
  set redirectUri(value: string | null) {
    this.setString(AuthenticationProperties.RedirectUriKey, value);
  }

  /**
   * Gets or sets the time at which the authentication ticket was issued.
   */
  get issuedUtc(): Date | null {
    return this.getDateTimeOffset(AuthenticationProperties.IssuedUtcKey);
  }
  set issuedUtc(value: Date | null) {
    this.setDateTimeOffset(AuthenticationProperties.IssuedUtcKey, value);
  }

  /**
   * Gets or sets the time at which the authentication ticket expires.
   */
  get expiresUtc(): Date | null {
    return this.getDateTimeOffset(AuthenticationProperties.ExpiresUtcKey);
  }
  set expiresUtc(value: Date | null) {
    this.setDateTimeOffset(AuthenticationProperties.ExpiresUtcKey, value);
  }

  /**
   * Gets or sets if refreshing the authentication session should be allowed.
   */
  get allowRefresh(): boolean | null {
    return this.getBool(AuthenticationProperties.RefreshKey);
  }
  set allowRefresh(value: boolean | null) {
    this.setBool(AuthenticationProperties.RefreshKey, value);
  }

  /**
   * Get a string value from the `items` collection.
   */
  getString(key: string): string | null {
    return this.items[key] ?? null;
  }

  /**
   * Set or remove a string value from the `items` collection.
   */
  setString(key: string, value: string | null): void {
    if (value !== null && value !== undefined) {
      this.items[key] = value;
    } else {
      delete this.items[key];
    }
  }

  /**
   * Get a parameter from the `parameters` collection.
   */
  getParameter<T>(key: string): T | undefined {
    const obj = this.parameters[key];
    return obj as T | undefined;
  }

  /**
   * Set a parameter value in the `parameters` collection.
   */
  setParameter<T extends object>(key: string, value: T): void {
    this.parameters[key] = value;
  }

  /**
   * Get a nullable boolean from the `items` collection.
   */
  protected getBool(key: string): boolean | null {
    const value = this.items[key];
    if (value !== undefined && value !== null) {
      if (value === "true") return true;
      if (value === "false") return false;
    }
    return null;
  }

  /**
   * Set or remove a boolean value in the `items` collection.
   */
  protected setBool(key: string, value: boolean | null): void {
    if (value !== null && value !== undefined) {
      this.items[key] = value.toString();
    } else {
      delete this.items[key];
    }
  }

  /**
   * Get a nullable Date value from the `items` collection.
   */
  protected getDateTimeOffset(key: string): Date | null {
    const value = this.items[key];
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  /**
   * Sets or removes a Date value in the `items` collection.
   */
  protected setDateTimeOffset(key: string, value: Date | null): void {
    if (value) {
      this.items[key] = value.toUTCString(); // RFC1123 format
    } else {
      delete this.items[key];
    }
  }
}
