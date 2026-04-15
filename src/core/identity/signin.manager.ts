
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../claims/index.js";
import { AuthenticationScheme, IAuthenticationSchemeProvider, AuthenticationProperties, AuthenticationSchemeProvider } from "../../http/authentication/index.js";
import { HttpContext, HttpContextAccessor } from "../../http/index.js";
import { IHttpContextAccessor } from "../../http/types.js";
import { DefaultUserConfirmation, IUserConfirmation, UserClaimsPrincipalFactory } from "../extensions/index.js";
import { IdentityOptions } from "../options/index.js";
import { ArgumentNullThrowHelper, InvalidOperationException } from "../../types/exception.js";
import { ExternalLoginInfo, IdentityRole, IdentityUser } from "../types/index.js";
import { EventIds } from "./event_ids.js";
import { IdentityConstants } from "./identity.constants.js";
import { IdentityResult } from "./identity.result.js";
import { SignInResult } from "./signin.result.js";
import { UserManager } from "./user.manager.js";
import { IOptions } from "../../types/index.js";
import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";

/// <summary>
/// Provides the APIs for user sign in.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
export class SignInManager<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>> {
    private static readonly LoginProviderKey: string = "LoginProvider";
    private static readonly XsrfKey: string = "XsrfId";

    private contextAccessor: IHttpContextAccessor;
    private schemes: IAuthenticationSchemeProvider;
    private confirmation: IUserConfirmation<TKey, TUser>;
    private _context?: HttpContext;
    private twoFactorInfo?: TwoFactorAuthenticationInfo<TUser>;

    /// <summary>
    /// Creates a new instance of SignInManager{TUser}.
    /// </summary>
    constructor(
        public userManager: UserManager<TKey, TUser>,
        public claimsFactory: UserClaimsPrincipalFactory<TKey, TUser, IdentityRole<TKey>>,
        contextAccessor: HttpContextAccessor,
        optionsAccessor: IOptions<IdentityOptions>,
        schemes: AuthenticationSchemeProvider,
        confirmation: DefaultUserConfirmation<TKey, TUser>
    ) {
        ArgumentNullThrowHelper.throwIfNull(userManager);
        ArgumentNullThrowHelper.throwIfNull(contextAccessor);
        ArgumentNullThrowHelper.throwIfNull(claimsFactory);

        this.userManager = userManager;
        this.contextAccessor = contextAccessor;
        this.claimsFactory = claimsFactory;
        this.options = optionsAccessor?.value ?? new IdentityOptions();
        this.schemes = schemes;
        this.confirmation = confirmation;
    }

    /// <summary>
    /// The IdentityOptions used.
    /// </summary>
    public options: IdentityOptions;

    /// <summary>
    /// The authentication scheme to sign in with. Defaults to IdentityConstants.ApplicationScheme.
    /// </summary>
    public authenticationScheme: string = IdentityConstants.ApplicationScheme;

    /// <summary>
    /// The HttpContext used.
    /// </summary>
    public get context(): HttpContext {
        const ctx = this._context ?? this.contextAccessor?.httpContext;
        if (!ctx) {
            throw new InvalidOperationException("HttpContext must not be null.");
        }
        return ctx;
    }
    public set context(value: HttpContext) {
        this._context = value;
    }

    /// <summary>
    /// Creates a ClaimsPrincipal for the specified user, as an asynchronous operation.
    /// </summary>
    public async createUserPrincipalAsync(user: TUser): Promise<ClaimsPrincipal> {
        return await this.claimsFactory.createAsync(user);
    }

    /// <summary>
    /// Returns true if the principal has an identity with the application cookie identity.
    /// </summary>
    public isSignedIn(principal: ClaimsPrincipal): boolean {
        ArgumentNullThrowHelper.throwIfNull(principal);
        return principal.identities != null &&
            principal.identities.some(i => i.authenticationType === this.authenticationScheme);
    }

    /// <summary>
    /// Returns a flag indicating whether the specified user can sign in.
    /// </summary>
    public async canSignInAsync(user: TUser): Promise<boolean> {
        if (this.options.signIn.requireConfirmedEmail && !(await this.userManager.isEmailConfirmedAsync(user))) {
            return false;
        }
        if (this.options.signIn.requireConfirmedPhoneNumber && !(await this.userManager.isPhoneNumberConfirmedAsync(user))) {
            return false;
        }
        if (this.options.signIn.requireConfirmedAccount && !(await this.confirmation.isConfirmedAsync(this.userManager as any, user))) {
            return false;
        }
        return true;
    }

    /// <summary>
    /// Signs in the specified user, whilst preserving the existing AuthenticationProperties of the current signed-in user.
    /// </summary>
    public async refreshSignInAsync(user: TUser): Promise<void> {
        try {
            const { success, isPersistent } = await this.refreshSignInCoreAsync(user);
            const signInResult = success ? SignInResult.success : SignInResult.failed;
        } catch (ex) {
            throw ex;
        }
    }

    private async refreshSignInCoreAsync(user: TUser): Promise<{ success: boolean, isPersistent?: boolean }> {
        const auth = await this.context.authenticateAsync(this.authenticationScheme);
        if (!auth.succeeded || auth.principal?.identity?.isAuthenticated !== true) {
            console.error("RefreshSignInAsync prevented because the user is not currently authenticated. Use SignInAsync instead for initial sign in.");
            return { success: false, isPersistent: auth.properties?.isPersistent };
        }

        const authenticatedUserId = this.userManager.getUserId(auth.principal);
        const newUserId = await this.userManager.getUserIdAsync(user);
        if (authenticatedUserId == null || authenticatedUserId !== newUserId) {
            console.error("RefreshSignInAsync prevented because currently authenticated user has a different UserId. Use SignInAsync instead to change users.");
            return { success: false, isPersistent: auth.properties?.isPersistent };
        }

        let claims: Claim[] = [];
        const authenticationMethod = auth.principal?.findFirst(c => c.type === ClaimTypes.AuthenticationMethod);
        const amr = auth.principal?.findFirst(c => c.type === "amr");

        if (authenticationMethod != null || amr != null) {
            claims = [];
            if (authenticationMethod != null) {
                claims.push(authenticationMethod);
            }
            if (amr != null) {
                claims.push(amr);
            }
        }

        await this.signInWithClaimsAsync(user, auth.properties ?? null, claims);
        return { success: true, isPersistent: auth.properties?.isPersistent ?? false };
    }

    /// <summary>
    /// Signs in the specified user.
    /// </summary>
    public signInAsync(user: TUser, isPersistent: boolean, authenticationMethod?: string | null): Promise<void>;

    /// <summary>
    /// Signs in the specified user.
    /// </summary>
    public signInAsync(user: TUser, authenticationProperties: AuthenticationProperties, authenticationMethod?: string | null): Promise<void>;

    public signInAsync(user: TUser, arg2: boolean | AuthenticationProperties, authenticationMethod?: string | null): Promise<void> {
        if (typeof arg2 === "boolean") {
            // Overload with isPersistent
            return this.signInAsync(user, new AuthenticationProperties({ isPersistent: arg2.toString() }), authenticationMethod);
        } else {
            // Overload with AuthenticationProperties
            let additionalClaims: Claim[] = [];
            if (authenticationMethod != null) {
                additionalClaims.push(new Claim(ClaimTypes.AuthenticationMethod, authenticationMethod));
            }
            return this.signInWithClaimsAsync(user, arg2, additionalClaims);
        }
    }

    /// <summary>
    /// Signs in the specified user.
    /// </summary>
    public signInWithClaimsAsync(user: TUser, isPersistent: boolean, additionalClaims: Claim[]): Promise<void>;

    /// <summary>
    /// Signs in the specified user.
    /// </summary>
    public signInWithClaimsAsync(user: TUser, authenticationProperties: AuthenticationProperties | null, additionalClaims: Claim[]): Promise<void>;

    public async signInWithClaimsAsync(
        user: TUser,
        arg2: boolean | AuthenticationProperties | null,
        additionalClaims: Claim[]
    ): Promise<void> {
        if (typeof arg2 === "boolean") {
            // Overload with isPersistent
            return this.signInWithClaimsAsync(user, new AuthenticationProperties({ isPersistent: arg2.toString() }), additionalClaims);
        } else {
            // Overload with AuthenticationProperties
            try {
                const userPrincipal = await this.createUserPrincipalAsync(user);
                for (const claim of additionalClaims) {
                    userPrincipal.identities[0].addClaim(claim);
                }

                const authenticationProperties = arg2 ?? new AuthenticationProperties();
                await this.context.signInAsync(this.authenticationScheme, userPrincipal, authenticationProperties);

                this.context.user = userPrincipal;
            } catch (ex) {
                throw ex;
            }
        }
    }

    /// <summary>
    /// Signs the current user out of the application.
    /// </summary>
    public async signOutAsync(): Promise<void> {
        try {
            await this.context.signOutAsync(this.authenticationScheme);

            if (await this.schemes.getSchemeAsync(IdentityConstants.ExternalScheme) != null) {
                await this.context.signOutAsync(IdentityConstants.ExternalScheme);
            }
            if (await this.schemes.getSchemeAsync(IdentityConstants.TwoFactorUserIdScheme) != null) {
                await this.context.signOutAsync(IdentityConstants.TwoFactorUserIdScheme);
            }

        } catch (ex) {
            throw ex;
        }
    }

    /// <summary>
    /// Validates the security stamp for the specified principal.
    /// </summary>
    public validateSecurityStampAsync(principal: ClaimsPrincipal | null): Promise<TUser | null>;

    /// <summary>
    /// Validates the security stamp for the specified user.
    /// </summary>
    public validateSecurityStampAsync(user: TUser | null, securityStamp: string | null): Promise<boolean>;

    public async validateSecurityStampAsync(
        arg1: ClaimsPrincipal | TUser | null,
        arg2?: string | null
    ): Promise<TUser | null | boolean> {
        if (arg1 == null) {
            return null;
        }

        // Overload: principal
        if (arg1 instanceof ClaimsPrincipal) {
            const user = await this.userManager.getUserAsync(arg1);
            if (await this.validateSecurityStampAsync(user, arg1.findFirstValue(this.options.claimsIdentity.securityStampClaimType) ?? null)) {
                return user;
            }
            console.debug(EventIds.securityStampValidationFailedId4, "Failed to validate a security stamp.");
            return null;
        }

        // Overload: user + securityStamp
        const user = arg1 as TUser;
        const securityStamp = arg2 ?? null;
        return user != null &&
            (!this.userManager.supportsUserSecurityStamp ||
                securityStamp === await this.userManager.getSecurityStampAsync(user));
    }

    /// <summary>
    /// Validates the security stamp for the specified principal from two factor principals.
    /// </summary>
    public async validateTwoFactorSecurityStampAsync(principal: ClaimsPrincipal | null): Promise<TUser | null> {
        if (principal == null || principal.identity?.name == null) {
            return null;
        }
        const user = await this.userManager.findByIdAsync(principal.identity.name);
        if (await this.validateSecurityStampAsync(user, principal.findFirstValue(this.options.claimsIdentity.securityStampClaimType) ?? null)) {
            return user;
        }
        console.debug(EventIds.twoFactorSecurityStampValidationFailed, "Failed to validate a security stamp.");
        return null;
    }

    /// <summary>
    /// Attempts to sign in the specified user and password combination.
    /// </summary>
    public passwordSignInAsync(user: TUser, password: string, isPersistent: boolean, lockoutOnFailure: boolean): Promise<SignInResult>;

    /// <summary>
    /// Attempts to sign in the specified userName and password combination.
    /// </summary>
    public passwordSignInAsync(userName: string, password: string, isPersistent: boolean, lockoutOnFailure: boolean): Promise<SignInResult>;

    public async passwordSignInAsync(
        arg1: TUser | string,
        password: string,
        isPersistent: boolean,
        lockoutOnFailure: boolean
    ): Promise<SignInResult> {
        if (typeof arg1 === "string") {
            // Overload with userName
            const user = await this.userManager.findByNameAsync(arg1);
            if (user == null) {
                return SignInResult.failed;
            }
            return await this.passwordSignInAsync(user, password, isPersistent, lockoutOnFailure);
        } else {
            // Overload with user
            try {
                ArgumentNullThrowHelper.throwIfNull(arg1);

                const attempt = await this.checkPasswordSignInAsync(arg1, password, lockoutOnFailure);
                const result = attempt.succeeded
                    ? await this.signInOrTwoFactorAsync(arg1, isPersistent)
                    : attempt;

                return result;
            } catch (ex) {
                throw ex;
            }
        }
    }

    /// <summary>
    /// Attempts a password sign in for a user.
    /// </summary>
    public async checkPasswordSignInAsync(user: TUser, password: string, lockoutOnFailure: boolean): Promise<SignInResult> {
        try {
            ArgumentNullThrowHelper.throwIfNull(user);
            const result = await this.checkPasswordSignInCoreAsync(user, password, lockoutOnFailure);
            return result;
        } catch (ex) {
            throw ex;
        }
    }

    private async checkPasswordSignInCoreAsync(user: TUser, password: string, lockoutOnFailure: boolean): Promise<SignInResult> {
        const error = await this.preSignInCheck(user);
        if (error != null) {
            return error;
        }

        if (await this.userManager.checkPasswordAsync(user, password)) {
            const alwaysLockout = false // TODO: AppContext.tryGetSwitch("Microsoft.AspNetCore.Identity.CheckPasswordSignInAlwaysResetLockoutOnSuccess", out => out) && out;
            if (alwaysLockout || !(await this.isTwoFactorEnabledAsync(user)) || await this.isTwoFactorClientRememberedAsync(user)) {
                const resetLockoutResult = await this.resetLockoutWithResult(user);
                if (!resetLockoutResult.succeeded) {
                    return SignInResult.failed;
                }
            }
            return SignInResult.success;
        }

        console.debug(EventIds.invalidPassword, "User failed to provide the correct password.");

        if (this.userManager.supportsUserLockout && lockoutOnFailure) {
            const incrementLockoutResult = await this.userManager.accessFailedAsync(user) ?? IdentityResult.success();
            if (!incrementLockoutResult.succeeded) {
                return SignInResult.failed;
            }
            if (await this.userManager.isLockedOutAsync(user)) {
                return await this.lockedOut(user);
            }
        }
        return SignInResult.failed;
    }

    /// <summary>
    /// Returns a flag indicating if the current client browser has been remembered by two factor authentication.
    /// </summary>
    public async isTwoFactorClientRememberedAsync(user: TUser): Promise<boolean> {
        if (await this.schemes.getSchemeAsync(IdentityConstants.TwoFactorRememberMeScheme) == null) {
            return false;
        }
        const userId = await this.userManager.getUserIdAsync(user);
        const result = await this.context.authenticateAsync(IdentityConstants.TwoFactorRememberMeScheme);
        return (result?.principal != null && result.principal.findFirstValue(ClaimTypes.name) === userId);
    }

    /// <summary>
    /// Sets a flag on the browser to indicate the user has selected "Remember this browser".
    /// </summary>
    public async rememberTwoFactorClientAsync(user: TUser): Promise<void> {
        try {
            const principal = await this.storeRememberClient(user);
            await this.context.signInAsync(
                IdentityConstants.TwoFactorRememberMeScheme, principal, 
                new AuthenticationProperties({ isPersistent: true.toString() }));
        } catch (ex) {
            throw ex;
        }
    }

    /// <summary>
    /// Clears the "Remember this browser flag" from the current browser.
    /// </summary>
    public async forgetTwoFactorClientAsync(): Promise<void> {
        try {
            await this.context.signOutAsync(IdentityConstants.TwoFactorRememberMeScheme);
        } catch (ex) {
            throw ex;
        }
    }

        /// <summary>
    /// Signs in the user without two factor authentication using a two factor recovery code.
    /// </summary>
    public async twoFactorRecoveryCodeSignInAsync(recoveryCode: string): Promise<SignInResult> {
        try {
            const result = await this.twoFactorRecoveryCodeSignInCoreAsync(recoveryCode);
            return result;
        } catch (ex) {
            throw ex;
        }
    }

    private async twoFactorRecoveryCodeSignInCoreAsync(recoveryCode: string): Promise<SignInResult> {
        const twoFactorInfo = await this.retrieveTwoFactorInfoAsync();
        if (twoFactorInfo == null) {
            return SignInResult.failed;
        }
        const result = await this.userManager.redeemTwoFactorRecoveryCodeAsync(twoFactorInfo.user, recoveryCode);
        if (result.succeeded) {
            return await this.doTwoFactorSignInAsync(twoFactorInfo.user, twoFactorInfo, false, false);
        }
        return SignInResult.failed;
    }

    private async doTwoFactorSignInAsync(user: TUser, twoFactorInfo: TwoFactorAuthenticationInfo<TUser>, isPersistent: boolean, rememberClient: boolean): Promise<SignInResult> {
        const resetLockoutResult = await this.resetLockoutWithResult(user);
        if (!resetLockoutResult.succeeded) {
            return SignInResult.failed;
        }
        const claims: Claim[] = [new Claim("amr", "mfa")];
        if (twoFactorInfo.loginProvider != null) {
            claims.push(new Claim(ClaimTypes.AuthenticationMethod, twoFactorInfo.loginProvider));
        }
        if (await this.schemes.getSchemeAsync(IdentityConstants.ExternalScheme) != null) {
            await this.context.signOutAsync(IdentityConstants.ExternalScheme);
        }
        if (await this.schemes.getSchemeAsync(IdentityConstants.TwoFactorUserIdScheme) != null) {
            await this.context.signOutAsync(IdentityConstants.TwoFactorUserIdScheme);
            if (rememberClient) {
                await this.rememberTwoFactorClientAsync(user);
            }
        }
        await this.signInWithClaimsAsync(user, isPersistent, claims);
        return SignInResult.success;
    }

    /// <summary>
    /// Validates the sign in code from an authenticator app and creates and signs in the user.
    /// </summary>
    public async twoFactorAuthenticatorSignInAsync(code: string, isPersistent: boolean, rememberClient: boolean): Promise<SignInResult> {
        try {
            const result = await this.twoFactorAuthenticatorSignInCoreAsync(code, isPersistent, rememberClient);
            return result;
        } catch (ex) {
            throw ex;
        }
    }

    private async twoFactorAuthenticatorSignInCoreAsync(code: string, isPersistent: boolean, rememberClient: boolean): Promise<SignInResult> {
        const twoFactorInfo = await this.retrieveTwoFactorInfoAsync();
        if (twoFactorInfo == null) {
            return SignInResult.failed;
        }
        const user = twoFactorInfo.user;
        const error = await this.preSignInCheck(user);
        if (error != null) {
            return error;
        }
        if (await this.userManager.verifyTwoFactorTokenAsync(user, this.options.tokens.authenticatorTokenProvider, code)) {
            return await this.doTwoFactorSignInAsync(user, twoFactorInfo, isPersistent, rememberClient);
        }
        if (this.userManager.supportsUserLockout) {
            const incrementLockoutResult = await this.userManager.accessFailedAsync(user) ?? IdentityResult.success();
            if (!incrementLockoutResult.succeeded) {
                return SignInResult.failed;
            }
            if (await this.userManager.isLockedOutAsync(user)) {
                return await this.lockedOut(user);
            }
        }
        return SignInResult.failed;
    }

    /// <summary>
    /// Validates the two factor sign in code and creates and signs in the user.
    /// </summary>
    public async twoFactorSignInAsync(provider: string, code: string, isPersistent: boolean, rememberClient: boolean): Promise<SignInResult> {
        try {
            const result = await this.twoFactorSignInCoreAsync(provider, code, isPersistent, rememberClient);
            return result;
        } catch (ex) {
            throw ex;
        }
    }

        private async twoFactorSignInCoreAsync(provider: string, code: string, isPersistent: boolean, rememberClient: boolean): Promise<SignInResult> {
        const twoFactorInfo = await this.retrieveTwoFactorInfoAsync();
        if (twoFactorInfo == null) {
            return SignInResult.failed;
        }

        const user = twoFactorInfo.user;
        const error = await this.preSignInCheck(user);
        if (error != null) {
            return error;
        }
        if (await this.userManager.verifyTwoFactorTokenAsync(user, provider, code)) {
            return await this.doTwoFactorSignInAsync(user, twoFactorInfo, isPersistent, rememberClient);
        }
        if (this.userManager.supportsUserLockout) {
            const incrementLockoutResult = await this.userManager.accessFailedAsync(user) ?? IdentityResult.success();
            if (!incrementLockoutResult.succeeded) {
                return SignInResult.failed;
            }
            if (await this.userManager.isLockedOutAsync(user)) {
                return await this.lockedOut(user);
            }
        }
        return SignInResult.failed;
    }

    /// <summary>
    /// Gets the TUser for the current two factor authentication login.
    /// </summary>
    public async getTwoFactorAuthenticationUserAsync(): Promise<TUser | null> {
        const info = await this.retrieveTwoFactorInfoAsync();
        if (info == null) {
            return null;
        }
        return info.user;
    }

    /// <summary>
    /// Signs in a user via a previously registered third party login.
    /// </summary>
    public externalLoginSignInAsync(loginProvider: string, providerKey: string, isPersistent: boolean): Promise<SignInResult>;

    /// <summary>
    /// Signs in a user via a previously registered third party login.
    /// </summary>
    public externalLoginSignInAsync(loginProvider: string, providerKey: string, isPersistent: boolean, bypassTwoFactor: boolean): Promise<SignInResult>;

    public async externalLoginSignInAsync(
        loginProvider: string,
        providerKey: string,
        isPersistent: boolean,
        bypassTwoFactor?: boolean
    ): Promise<SignInResult> {
        if (typeof bypassTwoFactor === "undefined") {
            // Overload without bypassTwoFactor
            return this.externalLoginSignInAsync(loginProvider, providerKey, isPersistent, false);
        } else {
            // Overload with bypassTwoFactor
            try {
                const result = await this.externalLoginSignInCoreAsync(loginProvider, providerKey, isPersistent, bypassTwoFactor);
                return result;
            } catch (ex) {
                throw ex;
            }
        }
    }

    private async externalLoginSignInCoreAsync(loginProvider: string, providerKey: string, isPersistent: boolean, bypassTwoFactor: boolean): Promise<SignInResult> {
        const user = await this.userManager.findByLoginAsync(loginProvider, providerKey);
        if (user == null) {
            return SignInResult.failed;
        }
        const error = await this.preSignInCheck(user);
        if (error != null) {
            return error;
        }
        return await this.signInOrTwoFactorAsync(user, isPersistent, loginProvider, bypassTwoFactor);
    }

    /// <summary>
    /// Gets a collection of AuthenticationSchemes for the known external login providers.
    /// </summary>
    public async getExternalAuthenticationSchemesAsync(): Promise<AuthenticationScheme[]> {
        const schemes = await this.schemes.getAllSchemesAsync();
        return schemes.filter(s => s.displayName != null && s.displayName.length > 0);
    }

    /// <summary>
    /// Gets the external login information for the current login.
    /// </summary>
    public async getExternalLoginInfoAsync(expectedXsrf: string | null = null): Promise<ExternalLoginInfo | null> {
        const auth = await this.context.authenticateAsync(IdentityConstants.ExternalScheme);
        const items = auth?.properties?.items;
        if (auth?.principal == null || items == null || !(items as any).has(SignInManager.LoginProviderKey)) {
            return null;
        }
        const provider = (items as any).get(SignInManager.LoginProviderKey);
        if (expectedXsrf != null) {
            const userId = (items as any).get(SignInManager.XsrfKey);
            if (userId == null || userId !== expectedXsrf) {
                return null;
            }
        }
        const providerKey = auth.principal.findFirstValue(ClaimTypes.NameIdentifier) ?? auth.principal.findFirstValue("sub");
        if (providerKey == null || provider == null) {
            return null;
        }
        const providerDisplayName = (await this.getExternalAuthenticationSchemesAsync()).find(p => p.name === provider)?.displayName ?? provider;
        const extLoginInfo = new ExternalLoginInfo(auth.principal, provider, providerKey, providerDisplayName);
            extLoginInfo.authenticationTokens = auth.properties?.getTokens() ?? null;
            extLoginInfo.authenticationProperties = auth.properties ?? null;
        return extLoginInfo;
    }

    /// <summary>
    /// Stores any authentication tokens found in the external authentication cookie into the associated user.
    /// </summary>
    public async updateExternalAuthenticationTokensAsync(externalLogin: ExternalLoginInfo): Promise<IdentityResult> {
        ArgumentNullThrowHelper.throwIfNull(externalLogin);
        if (externalLogin.authenticationTokens != null && externalLogin.authenticationTokens.length > 0) {
            const user = await this.userManager.findByLoginAsync(externalLogin.loginProvider, externalLogin.providerKey);
            if (user == null) {
                return IdentityResult.failed([]);
            }
            for (const token of externalLogin.authenticationTokens) {
                const result = await this.userManager.setAuthenticationTokenAsync(user, externalLogin.loginProvider, token.name, token.value);
                if (!result.succeeded) {
                    return result;
                }
            }
        }
        return IdentityResult.success();
    }

    /// <summary>
    /// Configures the redirect URL and user identifier for the specified external login provider.
    /// </summary>
    public configureExternalAuthenticationProperties(provider: string | null, redirectUrl: string | null, userId: string | null = null): AuthenticationProperties {
        const properties = new AuthenticationProperties({ redirectUri: redirectUrl });
        (properties.items as any).set(SignInManager.LoginProviderKey, provider);
        if (userId != null) {
            (properties.items as any).set(SignInManager.XsrfKey, userId);
        }
        return properties;
    }

        /// <summary>
    /// Creates a claims principal for the specified 2fa information.
    /// </summary>
    static storeTwoFactorInfo(userId: string, loginProvider: string | null): ClaimsPrincipal {
        const identity = new ClaimsIdentity([], IdentityConstants.TwoFactorUserIdScheme);
        identity.addClaim(new Claim(ClaimTypes.name, userId));
        if (loginProvider != null) {
            identity.addClaim(new Claim(ClaimTypes.AuthenticationMethod, loginProvider));
        }
        return new ClaimsPrincipal(identity);
    }

    async storeRememberClient(user: TUser): Promise<ClaimsPrincipal> {
        const userId = await this.userManager.getUserIdAsync(user);
        const rememberBrowserIdentity = new ClaimsIdentity([], IdentityConstants.TwoFactorRememberMeScheme);
        rememberBrowserIdentity.addClaim(new Claim(ClaimTypes.name, userId));
        if (this.userManager.supportsUserSecurityStamp) {
            const stamp = await this.userManager.getSecurityStampAsync(user);
            rememberBrowserIdentity.addClaim(new Claim(this.options.claimsIdentity.securityStampClaimType, stamp));
        }
        return new ClaimsPrincipal(rememberBrowserIdentity);
    }

    /// <summary>
    /// Check if the user has two factor enabled.
    /// </summary>
    public async isTwoFactorEnabledAsync(user: TUser): Promise<boolean> {
        return this.userManager.supportsUserTwoFactor &&
            await this.userManager.getTwoFactorEnabledAsync(user) &&
            (await this.userManager.getValidTwoFactorProvidersAsync(user)).length > 0;
    }

    /// <summary>
    /// Signs in the specified user if bypassTwoFactor is false.
    /// </summary>
    protected async signInOrTwoFactorAsync(user: TUser, isPersistent: boolean, loginProvider: string | null = null, bypassTwoFactor: boolean = false): Promise<SignInResult> {
        if (!bypassTwoFactor && await this.isTwoFactorEnabledAsync(user)) {
            if (!await this.isTwoFactorClientRememberedAsync(user)) {
                this.twoFactorInfo = { user, loginProvider: loginProvider ?? undefined };
                if (await this.schemes.getSchemeAsync(IdentityConstants.TwoFactorUserIdScheme) != null) {
                    const userId = await this.userManager.getUserIdAsync(user);
                    await this.context.signInAsync(
                        IdentityConstants.TwoFactorUserIdScheme, 
                        SignInManager.storeTwoFactorInfo(userId, loginProvider),
                        new AuthenticationProperties({ isPersistent: isPersistent.toString() }));
                }
                return SignInResult.twoFactorRequired;
            }
        }
        if (loginProvider != null) {
            await this.context.signOutAsync(IdentityConstants.ExternalScheme);
        }
        if (loginProvider == null) {
            await this.signInWithClaimsAsync(user, isPersistent, [new Claim("amr", "pwd")]);
        } else {
            await this.signInAsync(user, isPersistent, loginProvider);
        }
        return SignInResult.success;
    }

    private async retrieveTwoFactorInfoAsync(): Promise<TwoFactorAuthenticationInfo<TUser> | null> {
        if (this.twoFactorInfo != null) {
            return this.twoFactorInfo;
        }
        const result = await this.context.authenticateAsync(IdentityConstants.TwoFactorUserIdScheme);
        if (result?.principal == null) {
            return null;
        }
        const userId = result.principal.findFirstValue(ClaimTypes.name);
        if (userId == null) {
            return null;
        }
        const user = await this.userManager.findByIdAsync(userId);
        if (user == null) {
            return null;
        }
        return { user, loginProvider: result.principal.findFirstValue(ClaimTypes.AuthenticationMethod) };
    }

    /// <summary>
    /// Used to determine if a user is considered locked out.
    /// </summary>
    protected async isLockedOut(user: TUser): Promise<boolean> {
        return this.userManager.supportsUserLockout && await this.userManager.isLockedOutAsync(user);
    }

    /// <summary>
    /// Returns a locked out SignInResult.
    /// </summary>
    protected lockedOut(user: TUser): Promise<SignInResult> {
        return Promise.resolve(SignInResult.lockedOut);
    }

    /// <summary>
    /// Used to ensure that a user is allowed to sign in.
    /// </summary>
    protected async preSignInCheck(user: TUser): Promise<SignInResult | null> {
        if (!await this.canSignInAsync(user)) {
            return SignInResult.notAllowed;
        }
        if (await this.isLockedOut(user)) {
            return await this.lockedOut(user);
        }
        return null;
    }

    /// <summary>
    /// Used to reset a user's lockout count.
    /// </summary>
    protected async resetLockout(user: TUser): Promise<void> {
        if (this.userManager.supportsUserLockout) {
            const result = await this.userManager.resetAccessFailedCountAsync(user) ?? IdentityResult.success();
            if (!result.succeeded) {
                throw new IdentityResultException(result);
            }
        }
    }

    private async resetLockoutWithResult(user: TUser): Promise<IdentityResult> {
        if (this.constructor === SignInManager) {
            if (!this.userManager.supportsUserLockout) {
                return IdentityResult.success();
            }
            return await this.userManager.resetAccessFailedCountAsync(user) ?? IdentityResult.success();
        }
        try {
            const resetLockoutTask = this.resetLockout(user);
            if (resetLockoutTask instanceof Promise) {
                return await resetLockoutTask ?? IdentityResult.success();
            }
            await resetLockoutTask;
            return IdentityResult.success();
        } catch (ex) {
            if (ex instanceof IdentityResultException) {
                return ex.identityResult;
            }
            throw ex;
        }
    }

}

/// <summary>
/// IdentityResultException mirrors the C# nested sealed class.
/// </summary>
class IdentityResultException extends Error {
    identityResult: IdentityResult;

    constructor(result: IdentityResult) {
        super();
        this.identityResult = result;
    }

    public override get message(): string {
        let sb = "ResetLockout failed.";
        for (const error of this.identityResult.errors) {
            sb += `\n${error.code}: ${error.description}`;
        }
        return sb;
    }
}

/// <summary>
/// TwoFactorAuthenticationInfo mirrors the C# nested sealed class.
/// </summary>
class TwoFactorAuthenticationInfo<TUser> {
    public user!: TUser;
    public loginProvider?: string;
}

