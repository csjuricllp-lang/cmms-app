import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkOrderEventsListener } from './listeners/work-order-events.listener';
import { AssetEventsListener } from './listeners/asset-events.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: true,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message when maximum amount of listeners is exceeded
      verboseMemoryLeak: false,
      // disable throwing error on unhandled event
      ignoreErrors: false,
    }),
    PrismaModule,
    NotificationsModule,
  ],
  providers: [WorkOrderEventsListener, AssetEventsListener],
  exports: [EventEmitterModule],
})
export class EventsModule {}
