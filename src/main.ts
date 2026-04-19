import { App, AppRole, AppUser } from "./App.js";
import { appRoutes } from "./App.routes.js";
import { DbContextOptions } from "./contexts/index.js";
import { IdentityDbContext, NodeDbContext } from "./core/contexts/index.js";
import { AuthorizationOptions } from "./core/index.js";
import { IdentityOptions } from "./core/options/index.js";
import { ServiceCollection } from "./features/index.js";
import { AuthenticationOptions } from "./http/authentication/index.js";
import { RouteCollection } from "./routing/index.js";

const app = new App();

// Configure options: AuthenticationOptions
app.configureOptions(AuthenticationOptions, (options: AuthenticationOptions) => {
    //
    return options;
});

// Configure options: AuthorizationOptions
app.configureOptions(AuthorizationOptions, (options: AuthorizationOptions) => {
    //
    return options;
});

// Configure options: IdentityOptions
app.configureOptions(IdentityOptions, (options: IdentityOptions) => {
    //
    return options;
});

app.addDbContext(
    IdentityDbContext as new () => NodeDbContext<AppUser, AppRole, string>, 
    (services: ServiceCollection, options: DbContextOptions) => {
    services.addScoped(IdentityDbContext, 
        NodeDbContext as new () => IdentityDbContext<AppUser, AppRole, string>, {
            0: options
        })
    return services;
});

// First: Register services
app.registerServices((services: ServiceCollection) => {
    // Register Services
    
    return services;
});

// Second: Register routes
app.registerRoutes((routes: RouteCollection) => {
    // Register Routes
    
    return appRoutes(routes);
});

// Register pipeline/services
app.addAuthentication();
app.addAuthorization();
app.addPolicyAuthorization();


// Must call before using useAuthentication()
app.useRouting();
// Add authentication before authorization
app.useAuthentication(); // or usePassportAuthentication
app.useAuthorization();

// Start server
app.start(4000);
