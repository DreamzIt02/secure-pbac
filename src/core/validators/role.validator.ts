

import { AllowedPrimaryKeysSafe } from "../../contexts/index.js";
import { ArgumentNullThrowHelper } from "../../types/exception.js";
import { IdentityError, IdentityErrorDescriber, IdentityResult, IRoleManager } from "../identity/index.js";
import { IdentityRole } from "../types/index.js";

/// <summary>
/// Provides an abstraction for validating a role.
/// </summary>
/// <typeparam name="TRole">The type encapsulating a role.</typeparam>
export interface IRoleValidator<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> {
    /// <summary>
    /// Validates a role as an asynchronous operation.
    /// </summary>
    /// <param name="manager">The IRoleManager{TRole} managing the role store.</param>
    /// <param name="role">The role to validate.</param>
    /// <returns>A Promise that represents the IdentityResult of the asynchronous validation.</returns>
    validateAsync(manager: IRoleManager<TKey, TRole>, role: TRole): Promise<IdentityResult>;
}

/// <summary>
/// Provides the default validation of roles.
/// </summary>
/// <typeparam name="TRole">The type encapsulating a role.</typeparam>
export class RoleValidator<TKey extends AllowedPrimaryKeysSafe, TRole extends IdentityRole<TKey>> implements IRoleValidator<TKey, TRole> {
    /// <summary>
    /// Creates a new instance of RoleValidator{TRole}.
    /// </summary>
    /// <param name="errors">The IdentityErrorDescriber used to provide error messages.</param>
    constructor(errors?: IdentityErrorDescriber) {
        this.describer = errors ?? new IdentityErrorDescriber();
    }

    private describer: IdentityErrorDescriber;

    /// <summary>
    /// Validates a role as an asynchronous operation.
    /// </summary>
    public async validateAsync(manager: IRoleManager<TKey, TRole>, role: TRole): Promise<IdentityResult> {
        ArgumentNullThrowHelper.throwIfNull(manager);
        ArgumentNullThrowHelper.throwIfNull(role);
        const errors = await this.validateRoleName(manager, role);
        if (errors?.length && errors.length > 0) {
            return IdentityResult.failed(errors);
        }
        return IdentityResult.success();
    }

    private async validateRoleName(manager: IRoleManager<TKey, TRole>, role: TRole): Promise<IdentityError[] | null> {
        let errors: IdentityError[] | null = null;
        const roleName = await manager.getRoleNameAsync(role);
        if (!roleName || roleName.trim().length === 0) {
            errors ??= [];
            errors.push(this.describer.invalidRoleName(roleName));
        } else {
            const owner = await manager.findByNameAsync(roleName);
            if (owner &&
                (await manager.getRoleIdAsync(owner)) !== (await manager.getRoleIdAsync(role))) {
                errors ??= [];
                errors.push(this.describer.duplicateRoleName(roleName));
            }
        }
        return errors;
    }
}
