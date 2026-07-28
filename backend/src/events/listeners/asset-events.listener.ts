import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AppEvents } from '../app-events';
import type { AssetUpdatedPayload, AssetDownPayload } from '../app-events';

@Injectable()
export class AssetEventsListener {
  private readonly logger = new Logger(AssetEventsListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent(AppEvents.ASSET_UPDATED)
  async handleAssetUpdated(payload: AssetUpdatedPayload) {
    this.logger.log(`Asset updated: ${payload.id}`);

    // Create audit log
    await this.prisma.auditLog
      .create({
        data: {
          action: 'ASSET_UPDATED',
          model: 'Asset',
          entityId: payload.id,
          userId: payload.userId,
          organizationId: payload.organizationId,
          newData: payload.data,
        },
      })
      .catch(() => {});
  }
}
