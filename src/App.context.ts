import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { useAuthentication, useAuthorization } from "./middlewares/index.js";
import { 
    AuthorizationEvaluator,
    AuthorizationHandlerContextFactory,
    AuthorizationHandlerProvider,
    AuthorizationMetrics,
    AuthorizationOptions, AuthorizationPolicyProvider, AuthorizationService, DefaultAuthorizationEvaluator, DefaultAuthorizationHandlerContextFactory,
    DefaultAuthorizationHandlerProvider, DefaultAuthorizationPolicyProvider, DefaultAuthorizationService, DefaultAuthorizationServiceImpl, 
    DefaultMeterFactory, IAuthorizationEvaluator, IAuthorizationHandlerContextFactory, IAuthorizationHandlerProvider, IAuthorizationMetrics, IAuthorizationPolicyProvider, 
    IAuthorizationService, IMeterFactory,
    MeterFactory} from "./core/index.js";
import { IdentityRole, IdentityUser } from "./core/types/index.js";
import { AuthorizationExtensions, DefaultPolicyAuthorizationService, IPolicyAuthorizationService, PolicyAuthorizationService } from "./policy/index.js";
import { AllowedPrimaryKeysSafe, DbContext, DbContextOptions } from "./contexts/index.js";
import { AuthenticationOptions } from "./http/authentication/index.js";
import { IdentityOptions } from "./core/options/index.js";
import { ILookupNormalizer, IPasswordHasher, IUserClaimsPrincipalFactory, LookupNormalizer, PasswordHasher, UserClaimsPrincipalFactory } from "./core/extensions/index.js";
import { IPasswordValidator, IRoleValidator, IUserValidator, PasswordValidator, RoleValidator, UserValidator } from "./core/validators/index.js";
import { HttpContext, HttpContextAccessor, RequestHandler, RequestMeta, RequestParams, ResponseHandler } from "./http/index.js";
import { Middleware, NextFn } from "./middlewares/types.js";
import { IServiceProvider, ServiceCollection } from "./features/index.js";
import { invokeWithBindings, RouteCollection } from "./routing/index.js";
import { IRouteProvider } from "./routing/types.js";
import { IdentityDbContext } from "./core/contexts/index.js";
import { UserStore } from "./core/extensions/user-stores/index.js";
import { RoleStore } from "./core/extensions/role-stores/index.js";
import { IdentityErrorDescriber, RoleManager, UserManager } from "./core/identity/index.js";
import { UserManager1 } from "./policy/identity/index.js";
import { IHttpContextAccessor } from "./http/types.js";

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
    private static readonly PROVIDER: IServiceProvider = null!;
    private static readonly ROUTES  : IRouteProvider   = null!;

    private middlewares!   : Middleware[];
    private routing!       : boolean;
    private register_service!: boolean;
    private identity_context!: boolean;
    private authentication!: boolean;
    private authorization! : boolean;

    constructor(
        private readonly authenticationOptions: AuthenticationOptions,
        private readonly authorizationOptions: AuthorizationOptions,
        private readonly identityOptions: IdentityOptions,
        private readonly contextOptions: DbContextOptions = new DbContextOptions(),
        private readonly services: ServiceCollection   = new ServiceCollection(),
        private readonly routes  : RouteCollection     = new RouteCollection(),
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
    public configureOptions<T extends AuthenticationOptions | AuthorizationOptions | IdentityOptions | DbContextOptions>(
        ctor: new (...args: any[]) => T,
        callback: (opts: T) => T
    ): void {
        if (this.register_service)
            throw new Error(`Pipeline must configure options before registerServices()`);

        if (ctor instanceof AuthenticationOptions) {
            (this.authenticationOptions as any) = callback(this.authenticationOptions as T);
        } else if (ctor instanceof AuthorizationOptions) {
            (this.authorizationOptions as any)  = callback(this.authorizationOptions as T);
        } else if (ctor instanceof IdentityOptions) {
            (this.identityOptions as any)       = callback(this.identityOptions as T);
        } else if (ctor instanceof DbContextOptions) {
            (this.contextOptions as any)        = callback(this.contextOptions as T);
        }
    }

    public registerServices = (callback: (services: ServiceCollection) => ServiceCollection) => {
        //
        this.register_service = true;
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
        // Register any other Route of App

        // Merge routes registered in Caller
        callback(this.routes);
        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.routes.build();
    }
    
    private registerServicesDefault = (callback: (services: ServiceCollection) => ServiceCollection) => {
        this.services.addSingleton(HttpContextAccessor, HttpContextAccessor as new ()    => IHttpContextAccessor, { });

        // Register default services of AppContext
        this.services.addSingleton(PasswordHasher,     PasswordHasher as new ()    => IPasswordHasher<any>, { });
        this.services.addSingleton(PasswordValidator,  PasswordValidator as new () => IPasswordValidator<any, any>, { });
        this.services.addSingleton(UserValidator,      UserValidator as new ()     => IUserValidator<any, any>, { });
        this.services.addSingleton(RoleValidator,      RoleValidator as new ()     => IRoleValidator<any, any>, { });
        this.services.addSingleton(LookupNormalizer,   LookupNormalizer as new ()  => ILookupNormalizer, { });
        //
        this.services.addSingleton(MeterFactory,         DefaultMeterFactory as new () => IMeterFactory, { });
        this.services.addSingleton(AuthorizationMetrics, AuthorizationMetrics as any as new () => IAuthorizationMetrics, { });
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
        this.services.addSingleton(AuthorizationPolicyProvider,
            DefaultAuthorizationPolicyProvider as any as new () => IAuthorizationPolicyProvider, { 0: options });
        this.services.addScoped(AuthorizationHandlerProvider,
            DefaultAuthorizationHandlerProvider as any as new () => IAuthorizationHandlerProvider, { 0: [] });
        this.services.addSingleton(AuthorizationHandlerContextFactory,
            DefaultAuthorizationHandlerContextFactory as new () => IAuthorizationHandlerContextFactory, { });
        this.services.addSingleton(AuthorizationEvaluator,
            DefaultAuthorizationEvaluator as new () => IAuthorizationEvaluator, { });

        this.services.addScoped(AuthorizationService,
            DefaultAuthorizationService as any as new () => IAuthorizationService, { 4: options });
        this.services.addScoped(AuthorizationService,
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
        this.services.addScoped(PolicyAuthorizationService,
            DefaultPolicyAuthorizationService as any as new () => IPolicyAuthorizationService<TKey, TUser>, { 3: options });

        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    private registerUserServices<
        TKey  extends AllowedPrimaryKeysSafe, 
        TUser extends IdentityUser<TKey>, 
        TRole extends IdentityRole<TKey>, 
        TContext extends DbContext,
        >() {
        if (!AppContext.PROVIDER) {
            throw new Error("Pipeline must call registerServices() first");
        }
        // Cast any to enforce readonly
        const options = { value: this.identityOptions };
        const errorDescriber = new IdentityErrorDescriber();
        //
        this.services.addScoped(UserStore,
            UserStore as any as new () => UserStore<TUser, TRole, TKey, TContext>, { 1: IdentityUser, 2: IdentityRole });
        this.services.addScoped(RoleStore,
            RoleStore as any as new () => RoleStore<TRole, TKey, TContext>, { });
        //
        this.services.addScoped(UserManager,
            UserManager as any as new () => UserManager<TKey, TUser>, {6: errorDescriber, 7: options });
        this.services.addScoped(UserManager1,
            UserManager1 as any as new () => UserManager1<TKey, TUser>, { 6: errorDescriber, 7: options });

        this.services.addScoped(RoleManager,
            RoleManager as any as new () => RoleManager<TKey, TRole>, { 3: errorDescriber });

        // this.services.addScoped(UserClaimsPrincipalFactory,
        //     UserClaimsPrincipalFactory as any as new () => IUserClaimsPrincipalFactory<TKey, TUser>, { 2: options });
            
        // Cast any, to omit readonly
        (AppContext.PROVIDER as any) = this.services.build();
    }

    addDbContext<TContext extends DbContext>(
        context: new (...args: any[]) => TContext,
        callback: (services: ServiceCollection, options: DbContextOptions) => ServiceCollection) {
        
        if (typeof callback === "function") {
            callback(this.services, this.contextOptions);
           
            // This ensures that identity_context is added to app context
            if (new context() instanceof IdentityDbContext)
                this.identity_context = true;
            
            // Cast any, to omit readonly
            (AppContext.PROVIDER as any) = this.services.build();
        }

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
        //
        if (this.identity_context)
            this.registerUserServices();
    }

    useRouting() {
        if (!AppContext.ROUTES) {
            throw new Error("Pipeline must call registerRoutes() before useRouting()");
        }
        this.routing = true;

        this.middlewares.push(
            async (ctx: HttpContext, next: NextFn) => {
                // Resolve route Handler and params
                const resolution = await AppContext.ROUTES.resolve(ctx.request);

                if (resolution) {
                    const requestParams = new RequestParams(resolution.headers, resolution.routeParams, resolution.queryParams);
                    const requestMeta   = new RequestMeta(resolution.method, resolution.template);
                    //

                    ctx.items.set(RequestParams,  requestParams);
                    ctx.items.set(RequestMeta,    requestMeta);
                    
                    ctx.items.set(RequestHandler, resolution.handler);
                    ctx.items.set(ResponseHandler, async (...args: any[]) => {
                        return invokeWithBindings(resolution.handler, resolution.routeName, resolution);
                    });

                    await next();
                } else {
                    ctx.response.notfound();
                }
            }
        );
    }

    useAuthentication() {
        if (!this.authentication) {
            throw new Error("We must call addAuthentication() first");
        }
        //
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
    
    private buildContext(req: IncomingMessage, res: ServerResponse): HttpContext {
        const context = new HttpContext(req, res);
        context.requestServices = AppContext.PROVIDER;
        context.items.set(AuthenticationOptions, this.authenticationOptions);
        context.items.set(AuthorizationOptions, this.authorizationOptions);
        context.items.set(IdentityOptions, this.identityOptions);
        context.items.set(DbContextOptions, this.contextOptions);

        return context;
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
            const context = this.buildContext(req, res);

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
                const context = this.buildContext(req, res);
                
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
                const handler = context.items.get(ResponseHandler);
                if (handler && typeof handler === "function") {
                    const result = await handler('GET RESULT');

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
                    context.response.notfound();
                }
            }

        };
        next();
    }
}
