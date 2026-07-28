import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_ALLOW_ANY_ROLE_KEY } from '../decorators/allow-any-role.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    @Optional() @Inject('BullQueue_audit') private auditQueue?: any,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Bypass check for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      this.logger.warn(`Fail-Closed: No authenticated user found on path ${req.url}`);
      return false;
    }

    // 2. Check for @AllowAnyRole() explicit opt-out
    const isAllowAnyRole = this.reflector.getAllAndOverride<boolean>(
      IS_ALLOW_ANY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isAllowAnyRole) {
      return true;
    }

    // 3. Read required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 4. FAIL-CLOSED DEFAULT: Deny access if route fails to declare authorization metadata
    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.warn(
        `Fail-Closed Security Triggered: Route [${req.method}] ${req.url} does not specify @RequirePermissions(), @AllowAnyRole(), or @Public(). Access DENIED by default.`,
      );
      // Non-blocking audit log execution
      this.logToAuditTrail(user, ['FAIL_CLOSED_NO_PERMISSION_DECORATOR'], context).catch(() => { });
      return false;
    }

    const userPermissions: string[] = user.permissions || [];

    // Wildcard 'ALL' or exact match for permission key
    const hasPermission =
      userPermissions.includes('ALL') ||
      requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      this.logger.warn(
        `Access Denied. User: ${user.email}, Required: ${requiredPermissions}, Has: ${userPermissions}`,
      );

      // Non-blocking audit log execution
      this.logToAuditTrail(user, requiredPermissions, context).catch(() => { });

      return false;
    }

    return true;
  }

  private async logToAuditTrail(
    user: any,
    required: string[],
    context: ExecutionContext,
  ) {
    const req = context.switchToHttp().getRequest();
    const auditPayload = {
      action: 'ACCESS_DENIED',
      model: 'Authorization',
      entityId: 'PERMISSIONS_GUARD',
      userId: user.userId || user.id || 'ANONYMOUS',
      organizationId: user.organizationId || 'NONE',
      newData: {
        required,
        userHas: user.permissions || [],
        path: req.url,
        method: req.method,
      },
    };

    try {
      if (this.auditQueue && typeof this.auditQueue.add === 'function') {
        // Offload audit log writing to BullMQ audit queue to eliminate DB write amplification DoS
        await this.auditQueue.add('access-denied-audit', auditPayload);
      } else {
        await this.prisma.auditLog.create({
          data: auditPayload,
        });
      }
    } catch (e) {
      this.logger.error('Failed to queue audit log', e.stack);
    }
  }
}
