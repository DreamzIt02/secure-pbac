import { IncomingMessage } from "http";
import "./http/http.context.extensions.js"; // ensures challenge/forbidden are defined

import { AppIdentityContext } from "./App.context.js";
import { ServiceCollection, ServiceProvider } from "./App.services.js";
import { AuthorizationOptions } from "./core/authorization.options.js";
import { IAuthorizationRequestHandlerContext } from "./core/types/index.js";
import { routes } from "./App.routes.js";
import { useAuthentication } from "./middlewares/index.js";

export class App extends AppIdentityContext {
    private readonly services!: ServiceCollection;
    public static readonly PROVIDER_SERVICES: ServiceProvider = new ServiceProvider([]);

    constructor() {
        super(new AuthorizationOptions())
    }
    protected getRouteHandler = (req: IncomingMessage): IAuthorizationRequestHandlerContext => routes[req.url!];

    public registerServices  = () => {
        (this.services as any) = new ServiceCollection();

        // Add Identity Service
        this.registerIdentityServices(this.services);
                
        // Cast any, to omit readonly
        (App.PROVIDER_SERVICES as any) = this.services.build();
    }

}

const app = new App();

// First: Register services
app.registerServices();

// Add authentication before authorization
app.use(useAuthentication); // or usePassportAuthentication

// Register pipeline
app.addAuthorization();
app.addPolicyAuthorization();
// 
app.useAuthorization();

// Start server
app.start(3000);
