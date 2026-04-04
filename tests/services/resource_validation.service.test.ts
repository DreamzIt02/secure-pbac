import { describe, it, expect } from 'vitest';
import { Claim } from '../../src/claims/index.js';
import { AuthorizeRoleEnum } from '../../src/roles/index.js';
import { ResourceManagerAuthorizeService, ResourceOwnerAuthorizeService } from '../../src/services/index.js';
import { IUser } from '../../src/types/index.js';

describe('ResourceManagerAuthorizeService', () => {
  const user: IUser<AuthorizeRoleEnum, Claim> = { id: '1', userName: 'managerUser', roles: [], claims: [] };
  const resource = { manager: 'managerUser' };

  it('should succeed when user is manager', async () => {
    const result = await ResourceManagerAuthorizeService.authorizeAsync(user, resource, 'ManagerOperation');
    expect(result.succeeded).toBe(true);
  });

  it('should fail when user is not manager', async () => {
    const result = await ResourceManagerAuthorizeService.authorizeAsync(user, { manager: 'otherUser' }, 'ManagerOperation');
    expect(result.succeeded).toBe(false);
  });

  it('should fail when operation name is not ManagerOperation', async () => {
    const result = await ResourceManagerAuthorizeService.authorizeAsync(user, resource, 'Read');
    expect(result.succeeded).toBe(false);
  });

  it('should fail when resource is null', async () => {
    const result = await ResourceManagerAuthorizeService.authorizeAsync(user, null as any, 'ManagerOperation');
    expect(result.succeeded).toBe(false);
  });
});

describe('ResourceOwnerAuthorizeService', () => {
  const user: IUser<AuthorizeRoleEnum, Claim> = { id: '1', userName: 'ownerUser', roles: [], claims: [] };
  const resource = { createBy: 'ownerUser' };

  it('should succeed when user is owner by username', async () => {
    const result = await ResourceOwnerAuthorizeService.authorizeAsync(user, resource, 'Read');
    expect(result.succeeded).toBe(true);
  });

  it('should succeed when user is owner by id', async () => {
    const result = await ResourceOwnerAuthorizeService.authorizeAsync(user, { createBy: '1' }, 'Update');
    expect(result.succeeded).toBe(true);
  });

  it('should fail when user is not owner', async () => {
    const result = await ResourceOwnerAuthorizeService.authorizeAsync(user, { createBy: 'otherUser' }, 'Delete');
    expect(result.succeeded).toBe(false);
  });

  it('should fail when operation name is not CRUD', async () => {
    const result = await ResourceOwnerAuthorizeService.authorizeAsync(user, resource, 'ManagerOperation');
    expect(result.succeeded).toBe(false);
  });

  it('should fail when resource is null', async () => {
    const result = await ResourceOwnerAuthorizeService.authorizeAsync(user, null as any, 'Read');
    expect(result.succeeded).toBe(false);
  });
});
