import { IncomingMessage, ServerResponse } from 'http';
import { Authorize } from './decorators/index.js';
import { Claim } from './claims/index.js';

// ### 3. Route registration (`routes.ts`)
export const routes: Record<string, any> = {};

function publicHandler(req: IncomingMessage, res: ServerResponse) {
  res.end("Any-one can access data");
}
Authorize()(publicHandler); // attach requirements metadata

function adminHandler(req: IncomingMessage, res: ServerResponse) {
  res.end("Admin-only data");
}
Authorize(["Admin"])(adminHandler);

function financeHandler(req: IncomingMessage, res: ServerResponse) {
  res.end("Finance department data");
}
Authorize(["Manager"], [new Claim("Department", "Finance")])(financeHandler);

// Now assign handlers to routes
routes["/public"]  = publicHandler;
routes["/admin"]   = adminHandler;
routes["/finance"] = financeHandler;
