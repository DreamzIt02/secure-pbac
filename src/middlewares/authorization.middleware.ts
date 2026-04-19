import { ClaimsPrincipal } from "../claims/index.js";
import { 
  AuthorizationService,
  IAuthorizationService
} from "../core/index.js";

import { IAuthorizationHandler, IAuthorizationRequestHandlerContext } from "../core/types/index.js";
import { isEmpty } from "../utils.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { Middleware, NextFn } from "./types.js";
import { HttpContext, RequestHandler } from "../http/index.js";

/**
 * Authorization middleware factory.
 * Creates a middleware that processes all __requirements attached by decorators.
 */
export function useAuthorization (): Middleware {

  return async (ctx: HttpContext, next: NextFn) => {
    ArgumentNullThrowHelper.throwIfNullOrEmpty(ctx);
    ArgumentNullThrowHelper.throwIfNullOrEmpty(next);

    try {

        const User: ClaimsPrincipal = ctx.user;
        const handler = ctx.items.get(RequestHandler) as IAuthorizationRequestHandlerContext | null;

        // Handler is required for global authorization middleware
        if (!handler) return ctx.response.challenge(); 

        // Skip authorization if AllowAnonymous is set
        if (handler.__allowAnonymous) return next();
        
        // Bare authorization with no requirements
        if (!User) return ctx.response.challenge();

        const requirements: Iterable<IAuthorizationHandler> = handler.__requirements;
        // No decorators — skip authorization
        if (!requirements || isEmpty(requirements)) return next();
        
        const scope       = ctx.requestServices.createScope();
        const authService = scope.getRequiredService<IAuthorizationService>(AuthorizationService);
        const authResult  = await authService.authorizeAsync(User, null, requirements);

        if (authResult.succeeded) return await next();

        return ctx.response.forbidden();

    } catch (error) {
      //
      ctx.response.statusCode = 500;
      ctx.response.statusMessage = 'Authorization check failed';
      const body = JSON.stringify({ error: error });

      // Minimal Node.js response handling
      ctx.response.setHeader?.('Content-Type', 'application/json');
      ctx.response.end?.(body);
    }
  };
}
