import { Claim, ClaimsPrincipal } from "../claims/index.js";
import { AllowedPrimaryKeysSafe } from "../contexts/index.js";
import { AuthorizationResult, IAuthorizationService } from "../core/index.js";
import { GroupPolicy, Policy, PolicyEnum, SitePolicy } from "../policies/index.js";
import { Role } from "../roles/index.js";
import { tryParse } from "../types/enums.js";
import { ArgumentNullThrowHelper } from "../types/exception.js";
import { IPolicyAuthorizationService } from "./policy.authorization.service.js";

export type ClaimExpression =
  | Claim // leaf claim
  | { and: ClaimExpression[] }          // logical AND
  | { or : ClaimExpression[] };         // logical OR

export type RoleExpression =
  | Role // leaf role
  | { and: RoleExpression[] }           // logical AND
  | { or : RoleExpression[] };          // logical OR

export type PolicyExpression =
  | Policy // leaf claim
  | { and: PolicyExpression[] }         // logical AND
  | { or : PolicyExpression[] };        // logical OR

export interface IPolicyExpressionEvaluatorFactory {
    evaluateClaims   (expr: ClaimExpression, user: ClaimsPrincipal, resource?: object) : Promise<AuthorizationResult>;
    evaluateRoles    (expr: RoleExpression, user: ClaimsPrincipal, resource?: object)  : Promise<AuthorizationResult>;
    evaluatePolicies (expr: PolicyExpression, user: ClaimsPrincipal, resource?: object): Promise<AuthorizationResult>;
    evaluateHierarchy(expr: ClaimExpression, user: ClaimsPrincipal, resource?: object, policies?: Iterable<string>): Promise<AuthorizationResult>
}

export class PolicyExpressionEvaluatorFactory<TKey  extends AllowedPrimaryKeysSafe> implements IPolicyExpressionEvaluatorFactory{
    constructor(
        protected readonly authService?      : IAuthorizationService,
        protected readonly authPolicyService?: IPolicyAuthorizationService<TKey>,
    ) {}

    public async evaluateClaims(expr: ClaimExpression, user: ClaimsPrincipal, resource?: object): Promise<AuthorizationResult> {
        if (expr instanceof Claim) {
            if (user.hasClaim(c => expr.equals(c)))
                return Promise.resolve(AuthorizationResult.success())
            return Promise.resolve(AuthorizationResult.failedDefault())
        }
        if ("and" in expr) {
            if (expr.and.every(async e => (await this.evaluateClaims(e, user, resource)).succeeded))
                return Promise.resolve(AuthorizationResult.success())
        }
        if ("or" in expr) {
            if(expr.or.some(async e => (await this.evaluateClaims(e, user, resource)).succeeded))
                return Promise.resolve(AuthorizationResult.success())
        }
        return Promise.resolve(AuthorizationResult.failedDefault())
    }
    
    public async evaluateRoles(expr: RoleExpression, user: ClaimsPrincipal, resource?: object): Promise<AuthorizationResult> {
        if (typeof expr === "string") {
            if (user.isInRole(expr))
                return Promise.resolve(AuthorizationResult.success())
            return Promise.resolve(AuthorizationResult.failedDefault())
        }
        if ("and" in expr) {
            if (expr.and.every(async e => (await this.evaluateRoles(e, user, resource)).succeeded))
                return Promise.resolve(AuthorizationResult.success())
            return Promise.resolve(AuthorizationResult.failedDefault())
        }
        if ("or" in expr) {
            if(expr.or.some(async e => (await this.evaluateRoles(e, user, resource)).succeeded))
                return Promise.resolve(AuthorizationResult.success())
            return Promise.resolve(AuthorizationResult.failedDefault())
        }
        return Promise.resolve(AuthorizationResult.failedDefault())
    }

    public async evaluatePolicies(expr: PolicyExpression, user: ClaimsPrincipal, resource?: object): Promise<AuthorizationResult> {
        ArgumentNullThrowHelper.throwIfNull(this.authService);

        let authorized: AuthorizationResult
        if (typeof expr === "string") {
            return this.authService!.authorizeAsync(user, resource ?? null, expr);
        }
        if ("and" in expr) {
            for (const e of expr.and) {
                authorized = await this.evaluatePolicies(e, user, resource);
                if (!authorized.succeeded)
                    return authorized
            }
            return Promise.resolve(AuthorizationResult.success())
        }
        if ("or" in expr) {
            for (const e of expr.or) {
                authorized = await this.evaluatePolicies(e, user, resource);
                if (authorized.succeeded)
                    return authorized
            }
            return Promise.resolve(AuthorizationResult.failedDefault())
        }
        return Promise.resolve(AuthorizationResult.failedDefault())
    }

    public async evaluateHierarchy(expr: ClaimExpression, user: ClaimsPrincipal, resource?: object, policies?: Iterable<string>): Promise<AuthorizationResult> {
        ArgumentNullThrowHelper.throwIfNull(this.authPolicyService);
        ArgumentNullThrowHelper.throwIfNull(policies);

        let policyAuthorized: PolicyEnum;
        // Check for Default Policy, if not succeeded then move on to list of policy from requirement
        let authorized: AuthorizationResult = await this.authPolicyService!.isDefaultAdmin(user);
        if (authorized.succeeded) {
          policyAuthorized = PolicyEnum.SiteAdmin;
        } else {
          const output: { value: PolicyEnum } = {} as any;
          // Check other policies in order
          for (const policyName of [...policies!]) {
            const policyEnum = tryParse(PolicyEnum, policyName, output) ? output.value : undefined;
            if (policyEnum && !SitePolicy.isDefaultAdmin(policyEnum)) {
    
              if (SitePolicy.isActingAdmin(policyEnum)) {
                authorized = await this.authPolicyService!.isActingAdmin(user);
                if (authorized.succeeded) {
                  policyAuthorized = policyEnum;
                  break;
                }
              }
              else if (SitePolicy.isGeneraleAdmin(policyEnum)) {
                authorized = await this.authPolicyService!.isGeneralAdmin(user);
                if (authorized.succeeded) {
                  policyAuthorized = policyEnum;
                  break;
                }
              }
              else {
                // Custom policy + optional claims check
                authorized = await this.authPolicyService!.authorizeAsync(user, policyEnum);
                if (authorized.succeeded) {
                  authorized = await this.evaluateClaims(expr, user, resource);
    
                  if (authorized.succeeded) {
                    policyAuthorized = policyEnum;
                    break;
                  }
                }
              }
            }
          }
        }
        if (authorized.succeeded) {
          // Attach the authorized policy to the context for later use
          GroupPolicy.addRequestPolicy(user, policyAuthorized!);
        }
        return Promise.resolve(authorized);
    }
}
