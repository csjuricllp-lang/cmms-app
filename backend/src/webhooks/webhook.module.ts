import { Module, Global } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookListener } from './webhook.listener';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    { provide: 'BullQueue_webhooks', useValue: { add: async () => ({}) } },
    WebhookService,
    WebhookListener,
  ],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
