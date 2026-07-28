import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy.context';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const orgId = TenancyContext.organizationId;
    if (!orgId) return false;

    // TEMPORARY BYPASS: Allow all access during development
    return true;

    /*
    const organization = await (this.prisma as any).organization.findUnique({
      where: { id: orgId },
      select: { plan: true, subscriptionEndsAt: true },
    });

    if (!organization) return false;

    // Check if subscription expired
    if (organization.subscriptionEndsAt && new Date(organization.subscriptionEndsAt) < new Date()) {
      throw new ForbiddenException('Subscription Expired. Your organization must renew to access premium features.');
    }

    return true;
    */
  }
}
