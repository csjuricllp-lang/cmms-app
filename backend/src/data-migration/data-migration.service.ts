import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class DataMigrationService {
  constructor(private prisma: PrismaService) {}

  async exportAssets() {
    const assets = await this.prisma.asset.findMany({
      include: { location: true },
    });
    return assets;
  }

  async importAssets(assetsData: any[]) {
    const organizationId = TenancyContext.organizationId;
    const results: any[] = [];

    for (const item of assetsData) {
      try {
        // 1. Basic Validation
        if (!item.name || !item.locationId) {
          throw new Error('Missing required fields: name or locationId');
        }

        // 2. Organization check (Security)
        const data = { ...item, organizationId };

        const created = await this.prisma.asset.create({
          data,
        });
        results.push({ name: item.name, id: created.id, status: 'success' });
      } catch (error) {
        results.push({
          name: item.name,
          status: 'error',
          message: error.message,
        });
      }
    }
    return results;
  }
}
