import { HttpContext } from "../http/index.js";

/**
 * Authorization middleware factory.
 * Node.js generic — can be adapted by any framework.
 */
export type NextFn = () => void;

/**
 * 
 */
export type Middleware = (ctx: HttpContext, next: () => void) => void;
