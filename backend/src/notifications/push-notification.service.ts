import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.logger.log('Web Push VAPID details configured.');
    } else {
      this.logger.warn('Web Push VAPID details missing in environment variables.');
    }
  }

  async subscribe(userId: string, organizationId: string, deviceId: string | undefined, subscription: any) {
    const { endpoint, keys } = subscription;
    
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        deviceId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updatedAt: new Date(),
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId,
        deviceId,
        organizationId,
      },
    });
  }

  async sendNotification(userId: string, title: string, body: string, url?: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No push subscriptions found for user ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url },
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      ),
    );

    // Clean up failed subscriptions
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'rejected') {
        const error = res.reason;
        if (error.statusCode === 404 || error.statusCode === 410) {
          this.logger.warn(`Push subscription expired or not found. Deleting: ${subscriptions[i].endpoint}`);
          await this.prisma.pushSubscription.delete({
            where: { endpoint: subscriptions[i].endpoint },
          });
        } else {
          this.logger.error(`Failed to send push notification to ${subscriptions[i].endpoint}:`, error);
        }
      }
    }
  }
}
