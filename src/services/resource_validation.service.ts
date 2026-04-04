import { Claim } from '../claims/index.js';
import { AuthorizeRoleEnum } from '../roles/index.js';
import { AuthorizationResult, ICreatorInfo, IManagerInfo, IUser } from '../types/index.js';

interface User extends IUser<AuthorizeRoleEnum, Claim> { }

export class ResourceManagerAuthorizeService {
  static async authorizeAsync(user: User, resource: IManagerInfo, operationName: string): Promise<AuthorizationResult> {
    if (!user || !resource) return { succeeded: false };
    if (operationName !== 'ManagerOperation') return { succeeded: false };

    const isManager = resource.manager === user.userName;
    return { succeeded: isManager };
  }
}

export class ResourceOwnerAuthorizeService {
  static async authorizeAsync(user: User, resource: ICreatorInfo, operationName: string): Promise<AuthorizationResult> {
    if (!user || !resource) return { succeeded: false };
    if (!['Create', 'Read', 'Update', 'Delete'].includes(operationName)) return { succeeded: false };

    const isOwner = resource.createBy === user.userName || resource.createBy === user.id;
    return { succeeded: isOwner };
  }
}
