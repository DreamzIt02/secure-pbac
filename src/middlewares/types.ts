import { IncomingMessage } from "http";
import { IAuthorizationRequestHandlerContext } from "../core/types/index.js";

/**
 * Authorization middleware factory.
 * Node.js generic — can be adapted by any framework.
 */
export type NextFn = () => void;

/**
 * Frameworks must supply their own route handler resolver.
 * For example, Express can map `req` to its matched handler.
 */
export type GetRouteHandlerFn = (req: IncomingMessage) => IAuthorizationRequestHandlerContext;
