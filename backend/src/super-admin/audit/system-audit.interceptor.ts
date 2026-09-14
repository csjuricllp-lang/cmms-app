import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemAuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Only intercept mutating requests (POST, PATCH, PUT, DELETE)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next.handle();
    }

    const actionType = `${request.method} ${request.route?.path}`;
    const targetEntity = request.route?.path?.split('/')[3] || 'UNKNOWN'; // /api/system/organizations -> organizations
    const targetId = request.params?.id || 'UNKNOWN';

    return next.handle().pipe(
      tap(async (data) => {
        // Success
        await this.prisma.systemAuditLog.create({
          data: {
            actorId: user?.id || 'UNKNOWN',
            actionType,
            targetEntity,
            targetId,
            snapshot: data ? JSON.parse(JSON.stringify(data)) : null,
          },
        });
      }),
      catchError(async (error) => {
        // Failure
        await this.prisma.systemAuditLog.create({
          data: {
            actorId: user?.id || 'UNKNOWN',
            actionType: `${actionType} (FAILED)`,
            targetEntity,
            targetId,
            snapshot: { error: error.message },
          },
        });
        throw error;
      }),
    );
  }
}
