import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsQueueProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing notification job ${job.id} for type: ${job.data.type}`,
    );

    // Logic for sending email or push notification
    // e.g. AWS SES, SendGrid, OneSignal, etc.

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Notification job ${job.id} failed: ${error.message}`);
    // Potentially retry or notify admin
  }
}
