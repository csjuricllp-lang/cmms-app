import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhookService } from './webhook.service';

@Injectable()
export class WebhookListener {
  private readonly logger = new Logger(WebhookListener.name);

  constructor(
    private webhookService: WebhookService,
    @Inject('BullQueue_webhooks') private webhookQueue: any,
  ) {}

  @OnEvent('workorder.*')
  @OnEvent('asset.*')
  @OnEvent('part.*')
  async handleEntityEvent(event: string, payload: any) {
    const orgId = payload.organizationId;
    if (!orgId) return;

    // Find subscriptions for this event AND organization
    const subscriptions = await this.webhookService.findAllByEvent(
      event,
      orgId,
    );

    for (const sub of subscriptions) {
      this.logger.log(`Queueing Webhook for event: ${event} to: ${sub.url}`);
      await this.webhookQueue.add(
        'dispatch-webhook',
        {
          url: sub.url,
          event,
          payload,
          secret: sub.secret,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
        },
      );
    }
  }
}
