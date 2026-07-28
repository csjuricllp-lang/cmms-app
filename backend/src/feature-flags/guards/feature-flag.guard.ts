import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/require-feature.decorator';
import { FeatureFlagService } from '../feature-flag.service';
import { TenancyContext } from '../../common/tenancy.context';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(
      FEATURE_FLAG_KEY,
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const organizationId =
      user?.organizationId || TenancyContext.organizationId;

    if (!organizationId) return false;

    const isEnabled = await this.featureFlagService.isEnabled(
      requiredFeature,
      organizationId,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `The feature "${requiredFeature}" is disabled for your organization.`,
      );
    }

    return true;
  }
}
