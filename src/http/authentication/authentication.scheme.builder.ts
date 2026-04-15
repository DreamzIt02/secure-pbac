
import { InvalidOperationException } from "../../types/exception.js";
import { AuthenticationScheme } from "./authentication.scheme.js";

/// <summary>
/// Used to build <see cref="AuthenticationScheme"/>s.
/// </summary>
export class AuthenticationSchemeBuilder
{
    private readonly _name: string;
    /// <summary>
    /// Constructor.
    /// </summary>
    /// <param name="name">The name of the scheme being built.</param>
    public constructor(name: string)
    {
        this._name = name;
    }

    /// <summary>
    /// Gets the name of the scheme being built.
    /// </summary>
    public get name() {
        return this._name
    }

    /// <summary>
    /// Gets or sets the display name for the scheme being built.
    /// </summary>
    public displayName?: string | null;

    /// <summary>
    /// The IAuthenticationHandler type that handles this scheme.
    /// </summary>
    public handlerType?: Function;

    /// <summary>
    /// Builds the <see cref="AuthenticationScheme"/> instance.
    /// </summary>
    /// <returns>The <see cref="AuthenticationScheme"/>.</returns>
    public build(): AuthenticationScheme
    {
        if (typeof this.handlerType !== "function")
        {
            throw new InvalidOperationException(`handlerType must be configured to build an "AuthenticationScheme".`);
        }

        return new AuthenticationScheme(this.name, this.displayName ?? null, this.handlerType);
    }
}
