export type Role = string;

// Role identifiers
export enum AuthorizeRoleEnum {
  Default = 0,
  AuthorizeActingAdmin = 1,
  AuthorizeGeneralAdmin = 2,
  AuthorizeDepartmentAdmin = 3,
  AuthorizeManager = 4,
  // AuthorizeSupervisor = 417,
  // AuthorizeTeamLeader = 418,
}

// SiteRole utilities
export class SiteRole {
  static RoleDisplayName: Record<AuthorizeRoleEnum, string> = {
    [AuthorizeRoleEnum.Default]: 'Default',
    [AuthorizeRoleEnum.AuthorizeActingAdmin]: 'Acting Admin',
    [AuthorizeRoleEnum.AuthorizeGeneralAdmin]: 'General Admin',
    [AuthorizeRoleEnum.AuthorizeDepartmentAdmin]: 'Department Admin',
    [AuthorizeRoleEnum.AuthorizeManager]: 'Manager',
    // [AuthorizeRoleEnum.AuthorizeSupervisor]: 'Supervisor',
    // [AuthorizeRoleEnum.AuthorizeTeamLeader]: 'Team Leader',
  };

  static AllRoles: AuthorizeRoleEnum[] = Object.values(AuthorizeRoleEnum).filter(
    (v) => typeof v === 'number'
  ) as AuthorizeRoleEnum[];

  static AllRoleNames: string[] = Object.keys(AuthorizeRoleEnum).filter(
    (k) => isNaN(Number(k))
  );

  static AdminRoles: AuthorizeRoleEnum[] = SiteRole.AllRoles.filter((r) =>
    SiteRole.isAdministrativeRole(r)
  );

  static AdminRoleNames: string[] = SiteRole.AllRoleNames.filter((name) =>
    SiteRole.isAdministrativeRole(name)
  );

  static authorizeRoleName(T: AuthorizeRoleEnum): string {
    return AuthorizeRoleEnum[T];
  }
  static authorizeRoleNames(roles: AuthorizeRoleEnum[]): string[] {
    return roles.map(r => this.authorizeRoleName(r));
  }

  static DefaultRole = 'Default';

  static isAdministrativeRole(role: AuthorizeRoleEnum | string): boolean {
    const roleName =
      typeof role === 'string'
        ? role.toLowerCase()
        : AuthorizeRoleEnum[role].toLowerCase();

    switch (roleName) {
      case 'default':
      case 'authorizeactingadmin':
      case 'authorizegeneraladmin':
      case 'authorizedepartmentadmin':
      case 'authorizemanager':
        return true;
      default:
        return false;
    }
  }

  static isDepartmentAdminRole(role: AuthorizeRoleEnum | string): boolean {
    const roleName =
      typeof role === 'string'
        ? role.toLowerCase()
        : AuthorizeRoleEnum[role].toLowerCase();
    return roleName === 'authorizedepartmentadmin';
  }

  static isDepartmentManagerRole(role: AuthorizeRoleEnum | string): boolean {
    const roleName =
      typeof role === 'string'
        ? role.toLowerCase()
        : AuthorizeRoleEnum[role].toLowerCase();
    return roleName === 'authorizemanager';
  }
}
