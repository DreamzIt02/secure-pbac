// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { ClaimsIdentityOptions } from "./claims.identity.options.js";
import { LockoutOptions } from "./lockout.options.js";
import { PasswordOptions } from "./password.options.js";
import { SignInOptions } from "./signin.options.js";
import { StoreOptions } from "./store.options.js";
import { TokenOptions } from "./token.options.js";
import { UserOptions } from "./user.options.js";

/**
 * Represents all the options we can use to configure the identity system.
 */
export class IdentityOptions {
    /**
     * Gets or sets the ClaimsIdentityOptions for the identity system.
     * The ClaimsIdentityOptions for the identity system.
     */
    claimsIdentity: ClaimsIdentityOptions = new ClaimsIdentityOptions();

    /**
     * Gets or sets the UserOptions for the identity system.
     * The UserOptions for the identity system.
     */
    user: UserOptions = new UserOptions();

    /**
     * Gets or sets the PasswordOptions for the identity system.
     * The PasswordOptions for the identity system.
     */
    password: PasswordOptions = new PasswordOptions();

    /**
     * Gets or sets the LockoutOptions for the identity system.
     * The LockoutOptions for the identity system.
     */
    lockout: LockoutOptions = new LockoutOptions();

    /**
     * Gets or sets the SignInOptions for the identity system.
     * The SignInOptions for the identity system.
     */
    signIn: SignInOptions = new SignInOptions();

    /**
     * Gets or sets the TokenOptions for the identity system.
     * The TokenOptions for the identity system.
     */
    tokens: TokenOptions = new TokenOptions();

    /**
     * Gets or sets the StoreOptions for the identity system.
     * The StoreOptions for the identity system.
     */
    stores: StoreOptions = new StoreOptions();
}
