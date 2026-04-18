import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { useAuthentication, useAuthorization } from "./middlewares/index.js";
import { 
    AuthorizationMetrics,
    AuthorizationOptions, DefaultAuthorizationEvaluator, DefaultAuthorizationHandlerContextFactory,
    DefaultAuthorizationHandlerProvider, DefaultAuthorizationPolicyProvider, DefaultAuthorizationService, DefaultAuthorizationServiceImpl, 
    DefaultMeterFactory, IAuthorizationEvaluator, IAuthorizationHandlerContextFactory, IAuthorizationHandlerProvider, IAuthorizationMetrics, IAuthorizationPolicyProvider, 
    IAuthorizationService, IMeterFactory} from "./core/index.js";
import { IdentityUser } from "./core/types/index.js";
import { AuthorizationExtensions, DefaultPolicyAuthorizationService, IPolicyAuthorizationService } from "./policy/index.js";
import { AllowedPrimaryKeysSafe } from "./contexts/index.js";
import { AuthenticationOptions } from "./http/authentication/index.js";
import { IdentityOptions } from "./core/options/index.js";
import { TOKENS } from "./App.tokens.js";
import { ILookupNormalizer, IPasswordHasher, LookupNormalizer, PasswordHasher } from "./core/extensions/index.js";
import { IPasswordValidator, IRoleValidator, IUserValidator, PasswordValidator, RoleValidator, UserValidator } from "./core/validators/index.js";
import { HttpContext, HttpContextAccessor, RequestHandler, RequestParams } from "./http/index.js";
import { Middleware, NextFn } from "./middlewares/types.js";
import { IServiceProvider, ServiceCollection } from "./features/index.js";
import { RouteCollection } from "./routing/index.js";
import { IRouteProvider, RouteResolution } from "./routing/types.js";

// ### Using `Reflect`

// Instead of storing `__allowAnonymous` and `__requirements` directly on the context, we can attach them to the handler function via `Reflect.defineMetadata`:

// ```ts
// Reflect.defineMetadata("__allowAnonymous", true, handlerFn);
// Reflect.defineMetadata("__requirements", [requirement1, requirement2], handlerFn);
// ```

// Then when building our `IAuthorizationRequestHandlerContext` in `getRouteHandler`, we can read them:

// ```ts
// const handlerFn = routes[req.url!];
// if (!handlerFn) return null;

// return {
//   __allowAnonymous: Reflect.getMetadata("__allowAnonymous", handlerFn) ?? false,
//   __requirements: Reflect.getMetadata("__requirements", handlerFn) ?? [],
//   __handler: handlerFn
// };
// ```

export abstract class AppContext extends AuthorizationExtensions {
    protected static readonly PROVIDER: IServiceProvider = null!;
    protected static readonly ROUTES  : IRouteProvider   = null!;

    private middlewares!   : Middleware[];
    private routing!       : boolean;
    private authentication!: boolean;
    private authorization! : boolean;

    constructor(
        protected readonly authenticationOptions: AuthenticationOptions,
        protected readonly authorizationOptions: AuthorizationOptions,
        protected readonly identityOptions: IdentityOptions,
        protected readonly services: ServiceCollection   = new ServiceCollection(),
        protected readonly routes  : RouteCollection     = new RouteCollection(),
    ) {
        super(authorizationOptions)
        this.middlewares = [];
    }
    // protected abstract registerServices: (callback: (services: ServiceCollection) => ServiceCollection) => void;
    // protected abstract registerRoutes  : (callback: (routes: RouteCollection)     => RouteCollection) => void;

    /**
     * Generic configureOptions method
     * Allows configuring any of the option types (Authentication, Authorization, Identity, etc.)
     * Configure options by passing the constructor type as selector.
     */
    public configureOptions<T extends AuthenticationOptions | AuthorizationOptions | IdentityOptions>(
        ctor: new (...args: any[]) => T,
        callback: (opts: T) => T
    ): void {
        if (ctor instanceof AuthenticationOptions) {
            (this.authenticationOptions as any) = callback(this.authenticationOptions as T);
        } else if (ctor instanceof AuthorizationOptions) {
            (this.authorizationOptions as any)  = callback(this.authorizationOptions as T);
        } else if (ctor instanceof IdentityOptions) {
            (this.identityOptions as any)       = callback(this.identityOptions as T);
        }
    }

    public registerServices = (callback: (services: ServiceCollection) => ServiceCollection) => {
        // 
        this.registerServicesDefault((services: ServiceCollection) => {
            return services;
        });
        // Register any other Service of App

        // Merge services registered in Caller
        callback(this.services);
        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    public registerRoutes = (callback: (routes: RouteCollection) => RouteCollection) => {
        // 
        this.registerRoutesDefault((routes: RouteCollection) => {
            return routes;
        });
        // Register any other Service of App

        // Merge routes registered in Caller
        callback(this.routes);
        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.routes.build();
    }
    
    private registerServicesDefault = (callback: (services: ServiceCollection) => ServiceCollection) => {
        // Register default services of AppContext
        this.services.addSingleton(TOKENS.PASSWORD_HASHER,      PasswordHasher as new ()    => IPasswordHasher<any>, { });
        this.services.addSingleton(TOKENS.PASSWORD_VALIDATORS,  PasswordValidator as new () => IPasswordValidator<any, any>, { });
        this.services.addSingleton(TOKENS.USER_VALIDATORS,      UserValidator as new ()     => IUserValidator<any, any>, { });
        this.services.addSingleton(TOKENS.ROLE_VALIDATORS,      RoleValidator as new ()     => IRoleValidator<any, any>, { });
        this.services.addSingleton(TOKENS.KEY_NORMALIZER,       LookupNormalizer as new ()  => ILookupNormalizer, { });
        //
        this.services.addSingleton(TOKENS.METER_FACTORY,        DefaultMeterFactory as new () => IMeterFactory, { });
        this.services.addSingleton(TOKENS.AUTHORIZATION_METRICS, AuthorizationMetrics as any as new () => IAuthorizationMetrics, { });
        //
        callback(this.services);
        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    private registerRoutesDefault = (callback: (routes: RouteCollection) => RouteCollection) => {
        // The registerRoutesDefault() must at the second from the top of pipeline
        callback(this.routes);
        // Cast any, to omit readonly
        (AppContext.ROUTES as any) = this.routes.build();
    }

    private registerIdentityServices<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>() {
        if (!AppContext.PROVIDER) {
            throw new Error("Pipeline must call registerServices() first");
        }
        // Cast any to enforce readonly
        const options = { value: this.authorizationOptions };
        //
        this.services.addSingleton(TOKENS.AUTHORIZATION_POLICY_PROVIDER,
            DefaultAuthorizationPolicyProvider as any as new () => IAuthorizationPolicyProvider, { 0: options });
        this.services.addScoped(TOKENS.AUTHORIZATION_HANDLER_PROVIDER,
            DefaultAuthorizationHandlerProvider as any as new () => IAuthorizationHandlerProvider, { 0: [] });
        this.services.addSingleton(TOKENS.AUTHORIZATION_HANDLER_CONTEXT_FACTORY,
            DefaultAuthorizationHandlerContextFactory as new () => IAuthorizationHandlerContextFactory, { });
        this.services.addSingleton(TOKENS.AUTHORIZATION_EVALUATOR,
            DefaultAuthorizationEvaluator as new () => IAuthorizationEvaluator, { });

        this.services.addScoped(TOKENS.AUTHORIZATION_SERVICE,
            DefaultAuthorizationService as any as new () => IAuthorizationService, { 4: options });
        this.services.addScoped(TOKENS.AUTHORIZATION_SERVICE,
            DefaultAuthorizationServiceImpl as any as new () => IAuthorizationService, { 4: options });

        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    private registerPolicyServices<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>() {
        if (!AppContext.PROVIDER) {
            throw new Error("Pipeline must call registerIdentityServices() first");
        }

        const options = { value: this.identityOptions };
        //
        // Fallback to add identity services
        this.services.addScoped(TOKENS.POLICY_AUTHORIZATION_SERVICE,
            DefaultPolicyAuthorizationService as any as new () => IPolicyAuthorizationService<TKey, TUser>, { 3: options });

        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    addAuthentication(
        configureOptions?: (options: AuthenticationOptions) => AuthenticationOptions) {
        // This ensures that authorization is added to app context
        this.authentication = true;
        // Cast any to enforce readonly
        (this.authenticationOptions as any) = typeof configureOptions === "function" ? configureOptions(this.authenticationOptions) : this.authenticationOptions;
    }

    addAuthorization(
        configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions) {
        // This ensures that authorization is added to app context
        this.authorization = true;
        // Cast any to enforce readonly
        (this.authorizationOptions as any) = typeof configureOptions === "function" ? configureOptions(this.authorizationOptions) : this.authorizationOptions;
        //
        this.registerIdentityServices();
        //
        this.registerPolicyServices();
    }

    useRouting() {
        if (!AppContext.ROUTES) {
            throw new Error("Pipeline must call registerRoutes() before useRouting()");
        }
        this.routing = true;

        this.middlewares.push(
            async (ctx: HttpContext, next: NextFn) => {
                // Resolve route Handler and params
                const resolution = AppContext.ROUTES.resolve(ctx.request);

                if (resolution) {
                    const { handler, params } = resolution;
                    ctx.items.set(RequestHandler, handler);
                    ctx.items.set(RequestParams, params);
                }
                await next()
            }
        );
    }

    useAuthentication() {
        if (!this.authentication) {
            throw new Error("We must call addAuthentication() first");
        }

        this.middlewares.push(useAuthentication);
    }

    useAuthorization() {
        if (!this.authorization) {
            throw new Error("We must call addAuthorization() first");
        }
        //
        this.middlewares.push(useAuthorization());
    }

    use(mw: Middleware) {
        this.middlewares.push(mw);
    }
  
    start(
        port: number,
        configureServer?: (
            server: Server<typeof IncomingMessage, typeof ServerResponse>
        ) => Server<typeof IncomingMessage, typeof ServerResponse>
        ) {
        
        if (!AppContext.PROVIDER) {
            throw new Error("Pipeline must call registerServices() first");
        }

        if (!AppContext.ROUTES) {
            throw new Error("Pipeline must call registerRoutes() second");
        }

        if (!this.routing) {
            throw new Error("Pipeline must call useRouting() before start the server");
        }

        // Build the pipeline once, always including mandatory middlewares
        const pipeline: Middleware[] = [...this.middlewares];

        const defaultServer = createServer((req, res) => { 
            const context = new HttpContext(req, res);
            context.requestServices = AppContext.PROVIDER;

            HttpContextAccessor.runWithContext<HttpContext>(context, () => {
                this.runPipeline(context, pipeline);
                return context;
            });
        });

        // Allow user to configure or replace server instance
        const configuredServer =
            typeof configureServer === "function" ? configureServer(defaultServer) : undefined;

        // If user returns a new server, we must ensure our pipeline is still intact
        let server: Server<typeof IncomingMessage, typeof ServerResponse>;
        if (configuredServer) {
            // Remove any existing 'request' listeners
            configuredServer.removeAllListeners("request");

            // Prepend our pipeline as the sole request listener
            configuredServer.on("request", (req, res) => {
                const context = new HttpContext(req, res);
                context.requestServices = AppContext.PROVIDER;
                
                HttpContextAccessor.runWithContext<HttpContext>(context, () => {
                    this.runPipeline(context, pipeline);
                    return context;
                });

            });

            server = configuredServer;
        } else {
            server = defaultServer;
        }

        server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    }
    private runPipeline(context: HttpContext, pipeline: Middleware[]) {

        let i = 0;
        const next = async () => {
            const mw = pipeline[i++];
            if (mw) 
            {
                mw(context, next);
            } 
            else 
            {
                const handler = context.items.get(RequestHandler);
                if (handler && typeof handler === "function") {
                    const params = context.items.get(RequestParams) ?? {};
                    const result = handler(...Object.values(params));

                    // If handler returned something, write it to the response
                    if (result !== undefined && result !== null) {
                    if (typeof result === "string") {
                        context.response.end(result);
                    } else if (typeof result === "object") {
                        context.response.setHeader("Content-Type", "application/json");
                        context.response.end(JSON.stringify(result));
                    } else {
                        context.response.end(String(result));
                    }
                    } else {
                    // If handler returned nothing, ensure response is closed
                    if (!context.response.writableEnded) {
                        context.response.end();
                    }
                    }
                } else {
                    context.response.statusCode = 404;
                    context.response.end("Not Found");
                }
            }

        };
        next();
    }
}
