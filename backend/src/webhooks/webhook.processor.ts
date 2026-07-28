import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { url, event, payload, secret } = job.data;

    this.logger.log(`Dispatching Webhook: ${event} -> ${url}`);

    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CMMS-Event': event,
    };

    // --- High Security: Sign payload with secret ---
    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      headers['X-CMMS-Signature'] = signature;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );

      this.logger.log(
        `Webhook Delivered successfully! HTTP ${response.status}`,
      );
      return { status: response.status };
    } catch (error) {
      this.logger.error(`Webhook Dispatch Failed to ${url}: ${error.message}`);
      throw error; // Re-throw for BullMQ retry logic
    }
  }
}
