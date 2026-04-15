/// <summary>
/// Options to configure authentication.

import { ArgumentNullException, InvalidOperationException } from "../../types/exception.js";
import { IAuthenticationHandler } from "./authentication.handler.js";
import { AuthenticationSchemeBuilder } from "./authentication.scheme.builder.js";

/// </summary>
export class AuthenticationOptions
{
    private readonly _schemes: Array<AuthenticationSchemeBuilder> = [];

    /// <summary>
    /// Returns the schemes in the order they were added (important for request handling priority)
    /// </summary>
    public schemes: Iterable<AuthenticationSchemeBuilder> = this._schemes;

    /// <summary>
    /// Maps schemes by name.
    /// </summary>
    public schemeMap = new Map<string, AuthenticationSchemeBuilder>();

    /// <summary>
    /// Adds an <see cref="AuthenticationScheme"/>.
    /// </summary>
    /// <param name="name">The name of the scheme being added.</param>
    /// <param name="configureBuilder">Configures the scheme.</param>
    public addScheme(name: string, configureBuilder: Function): void;
    // {
    //     ArgumentNullException.throwIfNull(name);
    //     ArgumentNullException.throwIfNull(configureBuilder);

    //     if (this.schemeMap.has(name))
    //     {
    //         throw new InvalidOperationException("Scheme already exists: " + name);
    //     }

    //     let builder = new AuthenticationSchemeBuilder(name);
    //     configureBuilder(builder);
    //     this._schemes.push(builder);
    //     this.schemeMap.set(name, builder);
    // }

    /// <summary>
    /// Adds an <see cref="AuthenticationScheme"/>.
    /// </summary>
    /// <typeparam name="THandler">The <see cref="IAuthenticationHandler"/> responsible for the scheme.</typeparam>
    /// <param name="name">The name of the scheme being added.</param>
    /// <param name="displayName">The display name for the scheme.</param>
    public addScheme<THandler = IAuthenticationHandler>(name: string, displayName: string): void;

    public addScheme<THandler = IAuthenticationHandler>(
        name: string,
        configureBuilderOrDisplayName?: Function | string,
        handlerType?: new () => THandler
    ) {
        ArgumentNullException.throwIfNull(name);

        if (this.schemeMap.has(name)) {
            throw new InvalidOperationException("Scheme already exists: " + name);
        }

        const builder = new AuthenticationSchemeBuilder(name);

        if (typeof configureBuilderOrDisplayName === "function") {
            // First overload: configure function
            configureBuilderOrDisplayName(builder);
        } else {
            // Second overload: displayName + handlerType
            builder.displayName = configureBuilderOrDisplayName;
            builder.handlerType = handlerType ?? ({} as IAuthenticationHandler as any);
        }

        this._schemes.push(builder);
        this.schemeMap.set(name, builder);
    }

    /// <summary>
    /// Used as the fallback default scheme for all the other defaults.
    /// </summary>
    public defaultScheme?: string;

    /// <summary>
    /// Used as the default scheme by <see cref="IAuthenticationService.AuthenticateAsync(HttpContext, string)"/>.
    /// </summary>
    public defaultAuthenticateScheme?: string;

    /// <summary>
    /// Used as the default scheme by <see cref="IAuthenticationService.SignInAsync(HttpContext, string, System.Security.Claims.ClaimsPrincipal, AuthenticationProperties)"/>.
    /// </summary>
    public defaultSignInScheme?: string;

    /// <summary>
    /// Used as the default scheme by <see cref="IAuthenticationService.SignOutAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// </summary>
    public defaultSignOutScheme?: string;

    /// <summary>
    /// Used as the default scheme by <see cref="IAuthenticationService.ChallengeAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// </summary>
    public defaultChallengeScheme?: string;

    /// <summary>
    /// Used as the default scheme by <see cref="IAuthenticationService.ForbidAsync(HttpContext, string, AuthenticationProperties)"/>.
    /// </summary>
    public defaultForbidScheme?: string;

    /// <summary>
    /// If true, SignIn should throw if attempted with a user who is not authenticated.
    /// A user is considered authenticated if <see cref="ClaimsIdentity.IsAuthenticated"/> returns <see langword="true" /> for the <see cref="ClaimsPrincipal"/> associated with the HTTP request.
    /// </summary>
    public requireAuthenticatedSignIn: boolean = true;

    /// <summary>
    /// If true, DefaultScheme will not automatically use a single registered scheme.
    /// </summary>
    private _disableAutoDefaultScheme?: boolean;
    public get disableAutoDefaultScheme(): boolean 
    {
        if (this._disableAutoDefaultScheme !== undefined)
        {
            this._disableAutoDefaultScheme = false; /* AppContext.TryGetSwitch("Microsoft.AspNetCore.Authentication.SuppressAutoDefaultScheme", out var enabled) && enabled;*/
        }
        return this._disableAutoDefaultScheme!;
    }
    protected set disableAutoDefaultScheme(value: boolean)
    {
        this._disableAutoDefaultScheme = value;
    }
}
