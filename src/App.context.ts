import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { useAuthorization } from "./middlewares/index.js";
import { AuthorizationOptions, IAuthorizationService } from "./core/index.js";
import { IAuthorizationRequestHandlerContext } from "./core/types/index.js";
import { AuthorizationExtensions } from "./policy/index.js";

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
    private middlewares!: Middleware[];

    constructor(protected options: AuthorizationOptions) {
        super(options)
    }

    protected abstract getRouteHandler: (req: IncomingMessage) => IAuthorizationRequestHandlerContext;

    addAuthorization(
        configureOptions?: (options: AuthorizationOptions) => AuthorizationOptions) {
        // This ensures that authorization is added to app context
        this.middlewares = [];
        
        if (typeof configureOptions === "function") {
            this.options = configureOptions(this.options)
        }
    }

    useAuthorization(
        configureServices?: (services: IAuthorizationService) => IAuthorizationService) {
        if (!this.middlewares) {
        throw new Error("We must call addAuthorization() first");
        }
        this.middlewares.push(
            useAuthorization(this.getRouteHandler, 
                options => { 
                    this.options = { ...options, ...this.options } as AuthorizationOptions;
                    return this.options
                },
                configureServices
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

            // Wrap the user-provided server’s request listener to prepend our pipeline
            // const originalEmit = configuredServer.emit.bind(configuredServer);

            // configuredServer.emit = (event: string, ...args: any[]) => {
            //     if (event === "request") {
            //         const [req, res] = args;
            //         let i = 0;
            //         const next = () => {
            //         const mw = pipeline[i++];
            //         if (mw) {
            //             mw(req, res, next);
            //         } else {
            //             const handler = this.getRouteHandler(req);
            //             if (handler) {
            //                 handler(req, res);
            //             } else {
            //             res.statusCode = 404;
            //             res.end("Not Found");
            //             }
            //         }
            //         };
            //         next();
            //         return true; // handled
            //     }
            //     return originalEmit(event, ...args);
            // };

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
