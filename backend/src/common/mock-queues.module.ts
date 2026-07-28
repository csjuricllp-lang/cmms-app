import { Module, Global } from '@nestjs/common';

const mockQueue = {
  add: async () => ({ id: 'mock-id' }),
  process: async () => {},
  on: () => {},
};

@Global()
@Module({
  providers: [
    { provide: 'BullQueue_notifications', useValue: mockQueue },
    { provide: 'BullQueue_maintenance', useValue: mockQueue },
    { provide: 'BullQueue_audit', useValue: mockQueue },
    { provide: 'BullQueue_sync-queue', useValue: mockQueue },
  ],
  exports: [
    'BullQueue_notifications',
    'BullQueue_maintenance',
    'BullQueue_audit',
    'BullQueue_sync-queue',
  ],
})
export class MockQueuesModule {}
