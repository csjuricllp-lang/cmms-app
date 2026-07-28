import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Finds all active webhook subscriptions for a given event and organization
   */
  async findAllByEvent(event: string, organizationId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: {
        event,
        organizationId,
        isActive: true,
      },
    });
  }

  async createSubscription(data: any) {
    return this.prisma.webhookSubscription.create({
      data,
    });
  }
}
