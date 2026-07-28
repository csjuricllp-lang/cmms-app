import { SetMetadata } from '@nestjs/common';

export const IS_ALLOW_ANY_ROLE_KEY = 'isAllowAnyRole';

/**
 * Decorator to explicitly declare that an endpoint is accessible by any authenticated user,
 * bypassing fine-grained @RequirePermissions checks while remaining protected by JwtAuthGuard.
 */
export const AllowAnyRole = () => SetMetadata(IS_ALLOW_ANY_ROLE_KEY, true);
