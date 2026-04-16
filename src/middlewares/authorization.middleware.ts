import { ClaimsPrincipal } from "../claims/index.js";
import { 
  IAuthorizationService
} from "../core/index.js";

import { IncomingMessage, ServerResponse } from 'http';
import { IAuthorizationHandler, IAuthorizationRequestHandlerContext } from "../core/types/index.js";
import { isEmpty } from "../utils.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { GetRouteHandlerFn, NextFn } from "./types.js";

/**
 * Authorization middleware factory.
 * Creates a middleware that processes all __requirements attached by decorators.
 */
export function useAuthorization (
  getRouteHandler: GetRouteHandlerFn,
  // configureOptions? : (options: AuthorizationOptions) => AuthorizationOptions,
  // configureServices?: (services: IAuthorizationService) => IAuthorizationService,
  authService: IAuthorizationService,
) {
  ArgumentNullThrowHelper.throwIfNullOrEmpty(getRouteHandler);
  ArgumentNullThrowHelper.throwIfNullOrEmpty(authService);

  return async (req: IncomingMessage, res: ServerResponse, next: NextFn) => {

    try {

        const User: ClaimsPrincipal = (req as any).user;

        const handler = getRouteHandler(req); // Get the decorated function

        // Handler is required for global authorization middleware
        if (!handler) return res.challenge(); 

        // Skip authorization if AllowAnonymous is set
        if (handler.__allowAnonymous) return next();

        // Bare authorization with no requirements
        if (!User) return res.challenge();

        const requirements: Iterable<IAuthorizationHandler> = handler.__requirements;
        // No decorators — skip authorization
        if (!requirements || isEmpty(requirements)) return next();

        // const authOptions = typeof configureOptions === "function" 
        //                             ? configureOptions(new AuthorizationOptions()) 
        //                             : new AuthorizationOptions();

        // const options = { value: authOptions };

        // const defaultServices = new DefaultAuthorizationService(
        //   new DefaultAuthorizationPolicyProvider(options),
        //   new DefaultAuthorizationHandlerProvider(requirements),
        //   new DefaultAuthorizationHandlerContextFactory(),
        //   new DefaultAuthorizationEvaluator(),
        //   options
        // );
        // const authService = typeof configureServices === "function"
        //                               ? configureServices(defaultServices)
        //                               : defaultServices;

        const authResult = await authService.authorizeAsync(User, null, requirements);

        if (authResult.succeeded) return next();

        return res.forbidden();

    } catch (error) {

      res.statusCode = 500;
      res.statusMessage = 'Authorization check failed';
      const body = JSON.stringify({ error: error });

      // Minimal Node.js response handling
      res.setHeader?.('Content-Type', 'application/json');
      res.end?.(body);
    }
  };
}
