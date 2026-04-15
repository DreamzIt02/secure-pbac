
import { InvalidOperationException } from "../../types/exception.js";
import { IOptions } from "../../types/index.js";
import { AuthenticationOptions } from "./authentication.options.js";
import { AuthenticationScheme } from "./authentication.scheme.js";
import { IAuthenticationSchemeProvider } from "./authentication.scheme.provider.js";

/// <summary>
/// Implements <see cref="IAuthenticationSchemeProvider"/>.
/// </summary>
export class AuthenticationSchemeProvider implements IAuthenticationSchemeProvider
{
    private readonly _options: AuthenticationOptions;
    private readonly _schemes: Map<string, AuthenticationScheme>;
    //
    private static readonly _nullScheme = (): Promise<AuthenticationScheme | null> => Promise.resolve(null);
    private _autoDefaultScheme: Promise<AuthenticationScheme | null> = AuthenticationSchemeProvider._nullScheme();

    // Safe return values for enumeration
    private _schemesCopy: AuthenticationScheme[] = [];
    private _requestHandlers: AuthenticationScheme[] = [];
    private _requestHandlersCopy: AuthenticationScheme[] = [];

    /// <summary>
    /// Creates an instance of <see cref="AuthenticationSchemeProvider"/>
    /// using the specified <paramref name="options"/> and <paramref name="schemes"/>.
    /// </summary>
    /// <param name="options">The <see cref="AuthenticationOptions"/> options.</param>
    /// <param name="schemes">The dictionary used to store authentication schemes.</param>
    constructor(options: IOptions<AuthenticationOptions>, schemes?: Map<string, AuthenticationScheme>) {
        this._options = options.value;
        this._schemes = schemes ?? new Map<string, AuthenticationScheme>();

        // Initialize schemes from options
        for (const builder of this._options.schemes) {
        const scheme = builder.build();
        this.addScheme(scheme);
        }
    }

    private readonly _lock:  object = {};

    private async getDefaultSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultScheme
        ? this.getSchemeAsync(this._options.defaultScheme)
        : this._autoDefaultScheme;
    }

    /// <summary>
    /// Returns the scheme that will be used by default for <see cref="IAuthenticationService.AuthenticateAsync(HttpContext, string)"/>.
    /// This is typically specified via <see cref="AuthenticationOptions.DefaultAuthenticateScheme"/>.
    /// Otherwise, this will fallback to <see cref="AuthenticationOptions.DefaultScheme"/>.
    /// </summary>
    /// <returns>The scheme that will be used by default for <see cref="IAuthenticationService.AuthenticateAsync(HttpContext, string)"/>.</returns>
    public async getDefaultAuthenticateSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultAuthenticateScheme
        ? this.getSchemeAsync(this._options.defaultAuthenticateScheme)
        : this.getDefaultSchemeAsync();
    }

    /// <summary>
    /// Returns the scheme that will be used by default for <see cref="IAuthenticationService.ChallengeAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// This is typically specified via <see cref="AuthenticationOptions.DefaultChallengeScheme"/>.
    /// Otherwise, this will fallback to <see cref="AuthenticationOptions.DefaultScheme"/>.
    /// </summary>
    /// <returns>The scheme that will be used by default for <see cref="IAuthenticationService.ChallengeAsync(HttpContext, string, AuthenticationProperties)"/>.</returns>
    public async getDefaultChallengeSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultChallengeScheme
        ? this.getSchemeAsync(this._options.defaultChallengeScheme)
        : this.getDefaultSchemeAsync();
    }

    /// <summary>
    /// Returns the scheme that will be used by default for <see cref="IAuthenticationService.ForbidAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// This is typically specified via <see cref="AuthenticationOptions.DefaultForbidScheme"/>.
    /// Otherwise, this will fallback to <see cref="GetDefaultChallengeSchemeAsync"/> .
    /// </summary>
    /// <returns>The scheme that will be used by default for <see cref="IAuthenticationService.ForbidAsync(HttpContext, string, AuthenticationProperties)"/>.</returns>
    public async getDefaultForbidSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultForbidScheme
        ? this.getSchemeAsync(this._options.defaultForbidScheme)
        : this.getDefaultChallengeSchemeAsync();
    }

    /// <summary>
    /// Returns the scheme that will be used by default for <see cref="IAuthenticationService.SignInAsync(HttpContext, string, System.Security.Claims.ClaimsPrincipal, AuthenticationProperties)"/>.
    /// This is typically specified via <see cref="AuthenticationOptions.DefaultSignInScheme"/>.
    /// Otherwise, this will fallback to <see cref="AuthenticationOptions.DefaultScheme"/>.
    /// </summary>
    /// <returns>The scheme that will be used by default for <see cref="IAuthenticationService.SignInAsync(HttpContext, string, System.Security.Claims.ClaimsPrincipal, AuthenticationProperties)"/>.</returns>
    public async getDefaultSignInSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultSignInScheme
        ? this.getSchemeAsync(this._options.defaultSignInScheme)
        : this.getDefaultSchemeAsync();
    }

    /// <summary>
    /// Returns the scheme that will be used by default for <see cref="IAuthenticationService.SignOutAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// This is typically specified via <see cref="AuthenticationOptions.DefaultSignOutScheme"/>.
    /// Otherwise this will fallback to <see cref="GetDefaultSignInSchemeAsync"/> if that supports sign out.
    /// </summary>
    /// <returns>The scheme that will be used by default for <see cref="IAuthenticationService.SignOutAsync(HttpContext, string, AuthenticationProperties)"/>.</returns>
    public async getDefaultSignOutSchemeAsync(): Promise<AuthenticationScheme | null> {
        return this._options.defaultSignOutScheme
        ? this.getSchemeAsync(this._options.defaultSignOutScheme)
        : this.getDefaultSignInSchemeAsync();
    }

    /// <summary>
    /// Returns the <see cref="AuthenticationScheme"/> matching the name, or null.
    /// </summary>
    /// <param name="name">The name of the authenticationScheme.</param>
    /// <returns>The scheme or null if not found.</returns>
    public async getSchemeAsync(name: string): Promise<AuthenticationScheme | null> {
        return Promise.resolve(this._schemes.get(name) ?? null);
    }

    /// <summary>
    /// Returns the schemes in priority order for request handling.
    /// </summary>
    /// <returns>The schemes in priority order for request handling</returns>
    public async getRequestHandlerSchemesAsync(): Promise<AuthenticationScheme[]> {
        return Promise.resolve(this._requestHandlersCopy);
    }

    /// <summary>
    /// Registers a scheme for use by <see cref="IAuthenticationService"/>.
    /// </summary>
    /// <param name="scheme">The scheme.</param>
    /// <returns>true if the scheme was added successfully.</returns>
    public tryAddScheme(scheme: AuthenticationScheme): boolean {
        if (this._schemes.has(scheme.name)) {
        return false;
        }

        // If handler type supports request handling, add to requestHandlers
        if ((scheme as any).supportsRequestHandling) {
        this._requestHandlers.push(scheme);
        this._requestHandlersCopy = [...this._requestHandlers];
        }

        this._schemes.set(scheme.name, scheme);
        this._schemesCopy = [...this._schemes.values()];
        this.checkAutoDefaultScheme();

        return true;
    }

    /// <summary>
    /// Registers a scheme for use by <see cref="IAuthenticationService"/>.
    /// </summary>
    /// <param name="scheme">The scheme.</param>
    public addScheme(scheme: AuthenticationScheme): void {
        if (this._schemes.has(scheme.name)) {
        throw new InvalidOperationException("Scheme already exists: " + scheme.name);
        }
        if (!this.tryAddScheme(scheme)) {
        throw new InvalidOperationException("Scheme already exists: " + scheme.name);
        }
    }

    /// <summary>
    /// Removes a scheme, preventing it from being used by <see cref="IAuthenticationService"/>.
    /// </summary>
    /// <param name="name">The name of the authenticationScheme being removed.</param>
    public removeScheme(name: string): void {
        if (!this._schemes.has(name)) {
        return;
        }

        const scheme = this._schemes.get(name)!;
        this._requestHandlers = this._requestHandlers.filter(s => s !== scheme);
        this._requestHandlersCopy = [...this._requestHandlers];

        this._schemes.delete(name);
        this._schemesCopy = [...this._schemes.values()];
        this.checkAutoDefaultScheme();
    }

    /// <inheritdoc />
    public async getAllSchemesAsync(): Promise<AuthenticationScheme[]> {
        return Promise.resolve(this._schemesCopy);
    }

    private checkAutoDefaultScheme(): void {
        if (!this._options.disableAutoDefaultScheme) {
        if (this._schemes.size === 1) {
            this._autoDefaultScheme = Promise.resolve([...this._schemes.values()][0]);
        } else {
            this._autoDefaultScheme = AuthenticationSchemeProvider._nullScheme();
        }
        }
    }
}
