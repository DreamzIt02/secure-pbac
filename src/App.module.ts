import "./http/http.context.extensions.js"; // ensures challenge/forbidden are defined

import { AppContext } from "./App.context.js";
import { AuthenticationOptions, AuthenticationScheme, AuthenticationSchemeProvider, IAuthenticationSchemeProvider } from "./http/authentication/index.js";
import { AuthorizationMetrics, AuthorizationOptions, DefaultMeterFactory, IAuthorizationMetrics, IMeterFactory, MeterFactory } from "./core/index.js";
import { IdentityOptions } from "./core/options/index.js";
import { IdentityRole, IdentityUser } from "./core/types/index.js";
import { ServiceCollection } from "./features/index.js";
import { ILookupNormalizer, IPasswordHasher, LookupNormalizer, PasswordHasher } from "./core/extensions/index.js";
import { IPasswordValidator, IRoleValidator, IUserValidator, PasswordValidator, RoleValidator, UserValidator } from "./core/validators/index.js";
import { IOptions } from "./types/index.js";

export interface IModule {
  name: string;
  configureServices(app: AppContext): void;
  configureMiddleware?(app: AppContext): void; // optional
  configureOptions?(app: AppContext): void; // optional
  configureSchemes?(app: AppContext): void; // optional
}

export class ModuleLoader {
  private readonly loaded = new Set<string>();

  constructor(private readonly app: AppContext) {}

  loadModules(modules: IModule[]) {
    for (const module of modules) {
      if (this.loaded.has(module.name))
        throw new Error(`A module named: ${module.name} is already loaded.`)

      console.log(`[ModuleLoader] Loading ${module.name}...`);
      module.configureServices(this.app);

      if (module.configureMiddleware) {
        module.configureMiddleware(this.app);
      }

      if (module.configureOptions) {
        module.configureOptions(this.app);
      }

      if (module.configureSchemes) {
        module.configureSchemes(this.app);
      }

      this.loaded.add(module.name);
    }
  }
}

export const DefaultModule: IModule = {
  name: "DefaultModule",
  configureServices(app: AppContext) {
    app.configureServices((services: ServiceCollection) => {
      // Register default services of AppContext
      services.addSingleton(PasswordHasher,     PasswordHasher as new ()    => IPasswordHasher<any>, { });
      services.addSingleton(PasswordValidator,  PasswordValidator as new () => IPasswordValidator<any, any>, { });
      services.addSingleton(UserValidator,      UserValidator as new ()     => IUserValidator<any, any>, { });
      services.addSingleton(RoleValidator,      RoleValidator as new ()     => IRoleValidator<any, any>, { });
      services.addSingleton(LookupNormalizer,   LookupNormalizer as new ()  => ILookupNormalizer, { });
      //
      services.addSingleton(MeterFactory,         DefaultMeterFactory as new () => IMeterFactory, { });
      services.addSingleton(AuthorizationMetrics, AuthorizationMetrics as any as new () => IAuthorizationMetrics, { });
      return services;
    });
  }
};

export class AuthenticationModule implements IModule {
  public readonly name = "AuthenticationModule";
  private readonly options!: AuthenticationOptions;
  private readonly schemes!: Map<string, AuthenticationScheme>;

  configureOptions(app: AppContext): void {
    app.configureOptions(AuthenticationOptions, (opts: AuthenticationOptions) => {
      // Cast any to omit readonly
      (this.options as any) = opts;
      return this.options;
    });
  }

  configureSchemes(app: AppContext): void {
    app.configureSchemes((opts: Map<string, AuthenticationScheme>) => {
      // Cast any to omit readonly
      (this.schemes as any) = opts;
      return this.schemes;
    });
  }

  configureServices(app: AppContext) {
    app.configureServices((services: ServiceCollection) => {
      const options = { value: this.options };
      const schemes = this.schemes;
      services.addScoped(AuthenticationSchemeProvider,
          AuthenticationSchemeProvider as any as new () => IAuthenticationSchemeProvider, { 0: options, 1: schemes });
      return services;
    });
  }

  configureMiddleware(app: AppContext) {
    app.useAuthentication();
  }
};

export const AuthorizationModule: IModule = {
  name: "AuthorizationModule",
  configureServices(app: AppContext) {
    app.configureServices((services: ServiceCollection) => {
        services.addScoped(UserManager, UserManager);
        services.addScoped(RoleManager, RoleManager);
      return services;
    });
  },
  configureMiddleware(app) {
    app.useAuthorization();
  }
};

export const IdentityModule: IModule = {
  name: "IdentityModule",
  configureServices(app: AppContext) {
    app.configureServices((services: ServiceCollection) => {
        services.addScoped(UserManager, UserManager);
        services.addScoped(RoleManager, RoleManager);
      return services;
    });
  },
  configureMiddleware(app) {
    
  }
};

export class App extends AppContext {

    constructor(
    ) {
        super(new AuthenticationOptions(), new AuthorizationOptions(), new IdentityOptions())
    }
    // Override any Method of AppContext
    
}

export class AppUser extends IdentityUser<string> {
    constructor() {
        super()
    }
}

export class AppRole extends IdentityRole<string> {
    constructor() {
        super()
    }
}
