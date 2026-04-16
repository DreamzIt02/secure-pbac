import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { useAuthorization } from "./middlewares/index.js";
import { AUTHORIZATION_SERVICE, AuthorizationHandler, AuthorizationOptions, ClaimsAuthorizationRequirement, DefaultAuthorizationEvaluator, DefaultAuthorizationHandlerContextFactory, DefaultAuthorizationHandlerProvider, DefaultAuthorizationPolicyProvider, DefaultAuthorizationService, IAuthorizationService, RolesAuthorizationRequirement } from "./core/index.js";
import { IAuthorizationRequestHandlerContext, IdentityUser } from "./core/types/index.js";
import { AuthorizationExtensions, DefaultPolicyAuthorizationService, IPolicyAuthorizationService, POLICY_AUTHORIZATION_SERVICE } from "./policy/index.js";
import { ServiceCollection, ServiceProvider } from "./App.services.js";
import { AllowedPrimaryKeysSafe } from "./contexts/index.js";

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

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

export abstract class AppIdentityContext extends AuthorizationExtensions {
    private middlewares!  : Middleware[];
    private authorization!: boolean;

    public static readonly PROVIDER_IDENTITY: ServiceProvider = new ServiceProvider([]);

    constructor(protected readonly options: AuthorizationOptions) {
        super(options)
        this.middlewares = [];
    }

    protected abstract getRouteHandler : (req: IncomingMessage) => IAuthorizationRequestHandlerContext;
    protected abstract registerServices: ()  => void;

    protected registerIdentityServices(
        services: ServiceCollection,
        configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions) {

        // Cast any to enforce readonly
        (this.options as any) = typeof configureOptions === "function" ? configureOptions(this.options) : this.options;
        const options = { value: this.options };
        services.addSingleton(AUTHORIZATION_SERVICE, () => {
            return new DefaultAuthorizationService(
                new DefaultAuthorizationPolicyProvider(options),
                new DefaultAuthorizationHandlerProvider([]),
                new DefaultAuthorizationHandlerContextFactory(),
                new DefaultAuthorizationEvaluator(),
                options
            );
        });
        // Cast any, to omit readonly
        (AppIdentityContext.PROVIDER_IDENTITY as any) = services.build();
    }

    protected registerPolicyServices<TKey extends AllowedPrimaryKeysSafe, TUser extends IdentityUser<TKey>>(
        services: ServiceCollection,
        configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions) {
        // Cast any to enforce readonly
        (this.options as any) = typeof configureOptions === "function" ? configureOptions(this.options) : this.options;
        //
        const authService = AppIdentityContext.PROVIDER_IDENTITY.resolve<IAuthorizationService>(AUTHORIZATION_SERVICE);
        const passwordHasher = AppIdentityContext.PROVIDER_IDENTITY.resolve<IAuthorizationService>(AUTHORIZATION_SERVICE);
        // Fallback to add identity services
        const options = { value: this.options };
        services.addSingleton(POLICY_AUTHORIZATION_SERVICE, () => {
            return new DefaultPolicyAuthorizationService(
                authService,
                new DefaultAuthorizationHandlerProvider([]),
                new DefaultAuthorizationHandlerContextFactory(),
                new DefaultAuthorizationEvaluator(),
                options
            );
        });
        // Cast any, to omit readonly
        (AppIdentityContext.PROVIDER_IDENTITY as any) = services.build();
    }

    addAuthorization(
        configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions) {
        // This ensures that authorization is added to app context
        this.authorization = true;
        // Cast any to enforce readonly
        (this.options as any) = typeof configureOptions === "function" ? configureOptions(this.options) : this.options;
    }

    useAuthorization(
        /*configureServices?: (services: IAuthorizationService) => IAuthorizationService*/) {
        if (!this.authorization) {
            throw new Error("We must call addAuthorization() first");
        }
        const authService = AppIdentityContext.PROVIDER_IDENTITY
                                .resolve<IAuthorizationService>(AUTHORIZATION_SERVICE);

        // const _configureServices = typeof configureServices === "function" 
        //                                 ? configureServices 
        //                                 : () => AppIdentityContext.PROVIDER_AUTHORIZATION
        //                                             .resolve<IAuthorizationService>(AppIdentityContext.SERVICE_AUTHORIZATION);
        // const _configureOptions = (options: AuthorizationOptions) => 
        //                             this.options = { ...options, ...this.options } as AuthorizationOptions;
        this.middlewares.push(
            useAuthorization(
                this.getRouteHandler, 
                // _configureOptions,
                // _configureServices
                authService
            ));
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
        // Build the pipeline once, always including mandatory middlewares
        const pipeline: Middleware[] = [...this.middlewares];

        const defaultServer = createServer((req, res) => { this.runPipeline(req, res, pipeline); });

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
            this.runPipeline(req, res, pipeline);
            });

            server = configuredServer;
        } else {
            server = defaultServer;
        }

        server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    }
    private runPipeline(req: IncomingMessage, res: ServerResponse, pipeline: Middleware[]) {
        let i = 0;
        const next = () => {
            const mw = pipeline[i++];
            if (mw) 
            {
                mw(req, res, next);
            } 
            else 
            {
                const ctx = this.getRouteHandler(req);
                if (ctx && ctx.__handler) 
                {
                    ctx.__handler(req, res);
                } 
                else 
                {
                    res.statusCode = 404;
                    res.end("Not Found");
                }
            }
        };
        next();
    }
}
