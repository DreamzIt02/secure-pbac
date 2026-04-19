import { AllowAnonymous, Authorize } from './decorators/index.js';
import { Claim } from './claims/index.js';
import { HttpMethod } from './http/index.js';
import { FromQuery, Route, RouteCollection } from './routing/index.js';

@Route("user") // class-level prefix
class UserController {
  @Route(HttpMethod.GET, "/:id")
  @AllowAnonymous()
  publicHandler(
    @FromQuery("id") id: string, @FromQuery("type") type: string
  ) {
    return `Any-one can access data for this route: ${id}:${type}`;
  }

  @Route(HttpMethod.GET, "/admin")
  @Authorize(["Admin"])
  adminHandler() {
    return "Admin-only data";
  }

  @Route(HttpMethod.GET, "/finance")
  @Authorize(["Manager"], [new Claim("Department", "Finance")])
  financeHandler() {
    return "Finance department data";
  }
}

function publicHandler(id: string, type: string) {
  return (`Any-one can access data: ${id}: ${type}`);
}

function adminHandler() {
  return ("Admin-only data");
}

function financeHandler() {
  return ("Finance department data");
}

AllowAnonymous()(publicHandler); // attach requirements metadata
Authorize(["Admin"])(adminHandler);
Authorize(["Manager"], [new Claim("Department", "Finance")])(financeHandler);

// ### 3. Route registration (`routes.ts`)
export function appRoutes(routes: RouteCollection): RouteCollection {
  routes.add(HttpMethod.GET, "/public",   publicHandler,  "publicHandler");
  routes.add(HttpMethod.GET, "/admin",    adminHandler,   "adminHandler");
  routes.add(HttpMethod.GET, "/finance",  financeHandler, "financeHandler");
  //
  routes.addController(UserController);
  return routes;
}

