import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../permissions/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
