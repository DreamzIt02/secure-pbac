import { AuthorizeRoleEnum, SiteRole } from '../roles/index.js';
import { IdentityResult } from '../types/index.js';

export class RoleValidationService {
  static async validateAddToRoleAsync(
    role: AuthorizeRoleEnum,
    getUsersInRole: (roleName: string) => Promise<string[]>,
    userName: string
  ): Promise<IdentityResult> {
    const roleName = SiteRole.AuthorizeRoleName(role).toLowerCase();

    if (role === AuthorizeRoleEnum.Default) {
      return {
        succeeded: false,
        errors: [{ code: 'Forbidden', description: `No action allowed for ${userName}` }],
      };
    }

    switch (role) {
      case AuthorizeRoleEnum.AuthorizeActingAdmin:
      case AuthorizeRoleEnum.AuthorizeGeneralAdmin: {
        const users = await getUsersInRole(roleName);
        if (!users || users.length === 0) {
          return { succeeded: true };
        }
        return {
          succeeded: false,
          errors: [{ code: 'Max', description: `One user is allowed for ${userName}` }],
        };
      }
      case AuthorizeRoleEnum.AuthorizeDepartmentAdmin:
      case AuthorizeRoleEnum.AuthorizeManager:
        // Managed via claims in C#, always succeed here
        return { succeeded: true };
      default:
        return { succeeded: true };
    }
  }

  static async validateRemoveFromRoleAsync(
    role: AuthorizeRoleEnum,
    userName: string
  ): Promise<IdentityResult> {
    if (role === AuthorizeRoleEnum.Default) {
      return {
        succeeded: false,
        errors: [{ code: 'Forbidden', description: `No action allowed for ${userName}` }],
      };
    }
    return { succeeded: true };
  }
}
