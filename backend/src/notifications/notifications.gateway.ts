import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5178', 'http://127.0.0.1:5173'],
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      this.logger.debug(
        `Socket connection attempt with token: ${token ? 'PROVIDED' : 'MISSING'}`,
      );

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided for client ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      // Attach user to socket data as requested
      client.data.user = {
        userId: payload.userOrgId || payload.sub || payload.userId,
        globalUserId: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        permissions: payload.permissions || [],
      };

      this.logger.log(
        `Antigravity Secure WebSocket: Operational for user ${payload.email}`,
      );
    } catch (e) {
      this.logger.error(
        `Connection failed: Invalid token for client ${client.id}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Allow clients to join a specific Work Order room
  @SubscribeMessage('join_work_order')
  handleJoinWorkOrder(client: Socket, payload: { workOrderId: string }) {
    client.join(`workOrder_${payload.workOrderId}`);
    console.log(
      `Client ${client.id} joined room workOrder_${payload.workOrderId}`,
    );
  }

  @SubscribeMessage('leave_work_order')
  handleLeaveWorkOrder(client: Socket, payload: { workOrderId: string }) {
    client.leave(`workOrder_${payload.workOrderId}`);
  }

  // Allow clients to join their user-specific room
  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, payload: { userId: string }) {
    client.join(`user_${payload.userId}`);
    console.log(`Client ${client.id} joined room user_${payload.userId}`);
  }

  // Reconciliation for offline clients
  @SubscribeMessage('reconcile_missed')
  async handleReconcile(client: Socket, payload: { lastSyncTimestamp: string }) {
    const user = client.data.user;
    if (!user) return;

    try {
      const since = new Date(payload.lastSyncTimestamp);
      const missed = await this.notificationsService.findAllForUser(
        user.userId,
        user.organizationId,
        since
      );

      if (missed.length > 0) {
        client.emit('reconciled_notifications', missed);
        this.logger.log(`Reconciled ${missed.length} missed notifications for user ${user.email}`);
      }
    } catch (e) {
      this.logger.error(`Reconciliation failed: ${e.message}`);
    }
  }

  // --- Emitters ---

  notifyWorkOrderComment(workOrderId: string, comment: any) {
    this.server.to(`workOrder_${workOrderId}`).emit('new_comment', comment);
  }

  notifyWorkOrderAssignment(userId: string, workOrder: any) {
    this.server.to(`user_${userId}`).emit('work_order_assigned', workOrder);
  }

  notifyOverdueAlert(userId: string, workOrder: any) {
    this.server.to(`user_${userId}`).emit('work_order_overdue', workOrder);
  }

  notifyAssetDown(asset: any) {
    this.server.emit('asset_down', asset);
  }

  notifyCriticalBreakdown(workOrder: any) {
    this.server.emit('critical_breakdown', workOrder);
  }

  notifyNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification_created', notification);
  }
}
