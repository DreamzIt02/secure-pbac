import { AuthorizeClaimEnum, SiteClaim } from './claims/index.js';
import { AllowAnonymous, Authorize } from './core/decorators/index.js';
import { HttpMethod } from './http/index.js';
import { GroupPolicy, GroupPolicyEnum } from './policies/index.js';
import { AuthorizeHierarchy } from './policy/decorators/index.js';
import { AuthorizeRoleEnum, SiteRole } from './roles/index.js';
import { FromQuery, Route, RouteCollection } from './routing/index.js';

@Route("user") // class-level prefix
class UserController {
  @Route(HttpMethod.GET, "/public")
  @AllowAnonymous()
  publicHandler(
    @FromQuery("id") id: string, @FromQuery("type") type: string
  ) {
    return `Any-one can access data for this route: ${id}:${type}`;
  }

  @Route(HttpMethod.GET, "/admin")
  @Authorize([SiteRole.authorizeRoleName(AuthorizeRoleEnum.Default)])
  adminHandler() {
    return "Admin-only data for this route";
  }

  @Route(HttpMethod.GET, "/finance")
  @Authorize(
    [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager)], 
    [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentFinance)!]
  )
  financeHandler() {
    return "Finance department data for this route";
  }

  @Route(HttpMethod.GET, "/administration")
  @AuthorizeHierarchy(
    GroupPolicy.getGroupPolicies(GroupPolicyEnum.Manager),
    () => ({
      or: [
        SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentAdministration)!,
        { and: [
            SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentUser)!,
            SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentContent)! 
          ]
        }
      ]
    })
  )
  administrationHandler() {
    return "Administration department data for this route";
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
Authorize([SiteRole.authorizeRoleName(AuthorizeRoleEnum.Default)])(adminHandler);
Authorize(
  [SiteRole.authorizeRoleName(AuthorizeRoleEnum.AuthorizeManager)], 
  [SiteClaim.newClaim(AuthorizeClaimEnum.DepartmentFinance)!]
)(financeHandler);

// ### 3. Route registration (`routes.ts`)
export function appRoutes(routes: RouteCollection): RouteCollection {
  routes.add(HttpMethod.GET, "/public",   publicHandler,  "publicHandler");
  routes.add(HttpMethod.GET, "/admin",    adminHandler,   "adminHandler");
  routes.add(HttpMethod.GET, "/finance",  financeHandler, "financeHandler");
  //
  routes.addController(UserController);
  return routes;
}

