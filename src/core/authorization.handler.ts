// authorization.handler.ts

import { AuthorizationHandlerContext } from "./authorization.handler.context.js";
import { IAuthorizationHandler, IAuthorizationRequirement } from "./types/index.js";

/**
 * Base class for authorization handlers that need to be called for a specific requirement type,
 * optionally with a resource.
 *
 * @typeparam TRequirement The type of the requirement to handle.
 * @typeparam TResource The type of the resource to evaluate (optional).
 *
 * This mirrors ASP.NET Core's `AuthorizationHandler<TRequirement>` and
 * `AuthorizationHandler<TRequirement, TResource>` using overloads.
 */
export abstract class AuthorizationHandler<
  TRequirement extends IAuthorizationRequirement,
  TResource = undefined
> implements IAuthorizationHandler
{
  /**
   * Makes a decision if authorization is allowed.
   *
   * Iterates through all requirements of the given type and delegates
   * evaluation to `handleRequirementAsync`.
   *
   * @param context The authorization context.
   */
  async handleAsync(context: AuthorizationHandlerContext): Promise<void> {
    const resource = context.resource as TResource | undefined;

    for (const req of [...context.requirements].filter(
      (r): r is TRequirement => this.isRequirementType(r)
    )) {

      if (resource) {
        await this.handleRequirementAsync(context, req, resource);
      } else {
        await this.handleRequirementAsync(context, req);
      }
    }
  }

  /**
   * Type guard to check if a requirement is of type TRequirement.
   */
  protected abstract isRequirementType(
    requirement: IAuthorizationRequirement
  ): requirement is TRequirement;

  /**
   * Makes a decision if authorization is allowed based on a specific requirement.
   *
   * Overload for requirement-only handlers.
   *
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   */
  protected abstract handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: TRequirement
  ): Promise<void>;

  /**
   * Makes a decision if authorization is allowed based on a specific requirement and resource.
   *
   * Overload for requirement + resource handlers.
   *
   * @param context The authorization context.
   * @param requirement The requirement to evaluate.
   * @param resource The resource to evaluate.
   */
  protected abstract handleRequirementAsync(
    context: AuthorizationHandlerContext,
    requirement: TRequirement,
    resource: TResource
  ): Promise<void>;
}

// ### 🔑 Key Points
// - **Single class**: `AuthorizationHandler<TRequirement, TResource = undefined>` covers both overloads.
// - **Overloads for `handleRequirementAsync`**: We can implement either the 2‑parameter or 3‑parameter version depending on whether our handler uses a resource.
// - **Symmetry with C#**: Matches both `AuthorizationHandler<TRequirement>` and `AuthorizationHandler<TRequirement, TResource>` without renaming.
// - **Type guard**: `isRequirementType` ensures runtime filtering of requirements.

// ```ts
// // Requirement-only handler
// class MyRequirementHandler extends AuthorizationHandler<MyRequirement> {
//   protected isRequirementType(r: IAuthorizationRequirement): r is MyRequirement {
//     return r instanceof MyRequirement;
//   }
//   protected async handleRequirementAsync(context, requirement) {
//     // logic without resource
//   }
// }

// // Requirement + resource handler
// class MyResourceHandler extends AuthorizationHandler<MyRequirement, MyResource> {
//   protected isRequirementType(r: IAuthorizationRequirement): r is MyRequirement {
//     return r instanceof MyRequirement;
//   }
//   protected async handleRequirementAsync(context, requirement, resource) {
//     // logic with resource
//   }
// }
// ```
