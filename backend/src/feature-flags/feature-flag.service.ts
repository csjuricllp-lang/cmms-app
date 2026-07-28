import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a feature is enabled for the current organization
   * 1. Check FeatureFlag table (Higher priority)
   * 2. Fallback to organization.featureFlags (Legacy/JSON field)
   */
  async isEnabled(key: string, organizationId?: string): Promise<boolean> {
    const orgId = organizationId || TenancyContext.organizationId;
    if (!orgId) return false;

    // 1. Check FeatureFlag table
    const flag = await this.prisma.featureFlag.findUnique({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key,
        },
      },
    });

    if (flag !== null) {
      return flag.enabled;
    }

    // 2. Fallback to organization.featureFlags (JSON)
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { featureFlags: true },
    });

    if (
      organization?.featureFlags &&
      typeof organization.featureFlags === 'object'
    ) {
      const flags = organization.featureFlags as Record<string, any>;
      return !!flags[key];
    }

    return false;
  }

  async updateFlag(key: string, enabled: boolean, organizationId?: string) {
    const orgId = organizationId || TenancyContext.organizationId;
    if (!orgId)
      throw new InternalServerErrorException('Organization ID missing.');

    return this.prisma.featureFlag.upsert({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key,
        },
      },
      update: { enabled },
      create: {
        organizationId: orgId,
        key,
        enabled,
      },
    });
  }
}
