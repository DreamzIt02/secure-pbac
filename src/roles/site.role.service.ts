import { IdentityError, IdentityResult } from '../core/identity/index.js';
import { AuthorizeRoleEnum, SiteRole } from './index.js';

export class RoleValidationService {
  static async validateAddToRoleAsync(
    role: AuthorizeRoleEnum,
    getUsersInRole: (roleName: string) => Promise<string[]>,
    userName: string
  ): Promise<IdentityResult> {
    const roleName = SiteRole.authorizeRoleName(role).toLowerCase();

    if (role === AuthorizeRoleEnum.Default) {
      return IdentityResult.failed([
        new IdentityError('Forbidden', `No action allowed for ${userName}`)
      ]);
    }

    switch (role) {
      case AuthorizeRoleEnum.AuthorizeActingAdmin:
      case AuthorizeRoleEnum.AuthorizeGeneralAdmin: {
        const users = await getUsersInRole(roleName);
        if (!users || users.length === 0) {
          return IdentityResult.success();
        }
        return IdentityResult.failed([
          new IdentityError('Max', `One user is allowed for ${userName}`)
        ]);
      }
      case AuthorizeRoleEnum.AuthorizeDepartmentAdmin:
      case AuthorizeRoleEnum.AuthorizeManager:
        // Managed via claims in C#, always succeed here
        return IdentityResult.success();
      default:
        return IdentityResult.success();
    }
  }

  static async validateRemoveFromRoleAsync(
    role: AuthorizeRoleEnum,
    userName: string
  ): Promise<IdentityResult> {
    if (role === AuthorizeRoleEnum.Default) {
      return IdentityResult.failed([
        new IdentityError('Forbidden', `No action allowed for ${userName}`)
      ]);
    }
    return IdentityResult.success();
  }
}
