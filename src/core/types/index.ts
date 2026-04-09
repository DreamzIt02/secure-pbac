import { ServerResponse } from "http"
import { IncomingMessage } from "http"

export type { IAuthorizeData } from "./authorize.data.js"
export { IdentityRole } from "./identity.role.js"
export { IdentityUser } from "./identity.user.js"

export { PasswordVerificationResult } from "./password.verification.result.js"
export { UserLoginInfo } from "./user.login.info.js"
export { ExternalLoginInfo } from "./external.login.info.js"

/**
 * Represents an authorization requirement.
 */
export interface IAuthorizationRequirement { }

/**
 * Classes implementing this interface are able to make a decision if authorization is allowed.
 */
export interface IAuthorizationHandler {
  /**
   * Makes a decision if authorization is allowed.
   * @param context The authorization information.
   */
  handleAsync<TContext>(context: TContext | any): Promise<void>;
}
    
/**
 * We need to separate **metadata** from the **actual route function**. 
 * 
 * The fix is to extend `IAuthorizationRequestHandlerContext` so it also carries a reference to the real handler function. 
 * 
 * Then we can call that function, while still reading `__allowAnonymous` and `__requirements` via `Reflect`.
 */
export interface IAuthorizationRequestHandlerContext {
  __allowAnonymous: boolean;
  __requirements: Iterable<IAuthorizationHandler>;
  __handler: (req: IncomingMessage, res: ServerResponse) => void; // add this
}

// authorization.policy.builder.contract.ts
export interface IAuthorizationPolicyBuilderConstructor {
  new (...args: any[]): any;
}