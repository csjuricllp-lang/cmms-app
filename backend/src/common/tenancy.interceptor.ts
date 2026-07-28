import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, firstValueFrom } from 'rxjs';
import { TenancyContext } from './tenancy.context';

@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user || request.apiKey;

    if (user && user.organizationId) {
      return from(
        TenancyContext.runAsync(
          {
            organizationId: user.organizationId,
            userId: user.userId || user.sub || 'SYSTEM_API',
            userOrgId: user.userOrgId || 'SYSTEM_API',
            role: user.role || 'API_CLIENT',
            roleName: user.roleName || user.role || 'API_CLIENT',
            teamIds: user.teamIds || [],
            locationIds: user.locationIds || [],
            permissions: user.permissions || [],
          },
          async () => {
            return await firstValueFrom(next.handle());
          },
        ),
      );
    }

    return next.handle();
  }
}
