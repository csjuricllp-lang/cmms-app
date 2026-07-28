import { Module, Global } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsQueueProcessor } from './processors/notifications.processor';
import { MaintenanceQueueProcessor } from './processors/maintenance.processor';
import { AuditQueueProcessor } from './processors/audit.processor';
import { UploadsQueueProcessor } from './processors/uploads.processor';
import { Queue } from 'bullmq';

const useRedis = !!(process.env.REDIS_HOST || process.env.REDIS_URL);
const mockQueue = { add: async () => ({ id: 'mock-id' }) };

@Global()
@Module({
  imports: useRedis ? [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URL');
        if (url) {
          return { connection: { url } };
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'maintenance' },
      { name: 'audit' },
      { name: 'uploads' },
    ),
  ] : [ConfigModule],
  providers: useRedis ? [
    NotificationsQueueProcessor,
    MaintenanceQueueProcessor,
    AuditQueueProcessor,
    UploadsQueueProcessor,
    {
      provide: 'BullQueue_notifications',
      useFactory: (queue: Queue) => queue,
      inject: [getQueueToken('notifications')],
    },
    {
      provide: 'BullQueue_maintenance',
      useFactory: (queue: Queue) => queue,
      inject: [getQueueToken('maintenance')],
    },
    {
      provide: 'BullQueue_audit',
      useFactory: (queue: Queue) => queue,
      inject: [getQueueToken('audit')],
    },
    {
      provide: 'BullQueue_uploads',
      useFactory: (queue: Queue) => queue,
      inject: [getQueueToken('uploads')],
    },
  ] : [
    { provide: 'BullQueue_notifications', useValue: mockQueue },
    { provide: 'BullQueue_maintenance', useValue: mockQueue },
    { provide: 'BullQueue_audit', useValue: mockQueue },
    { provide: 'BullQueue_uploads', useValue: mockQueue },
  ],
  exports: [
    'BullQueue_notifications',
    'BullQueue_maintenance',
    'BullQueue_audit',
    'BullQueue_uploads',
  ],
})
export class QueuesModule {}
