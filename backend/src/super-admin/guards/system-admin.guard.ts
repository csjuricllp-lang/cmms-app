import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated.');
    }

    if (user.systemRole === SystemRole.NONE) {
      throw new ForbiddenException('Access denied. Super Admin privileges required.');
    }

    return true; // Allow SUPER_ADMIN and SUPPORT
  }
}
