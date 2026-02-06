import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.userId = user.id;

      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(client.id);

      // Join a personal room for direct notifications
      client.join(`user:${user.id}`);

      // Send unread count on connect
      const unreadCount = await this.notificationsService.getUnreadCount(
        user.id,
      );
      client.emit('unreadCount', { count: unreadCount });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) return { error: 'Not authenticated' };

    await this.notificationsService.markAsRead(
      data.notificationId,
      client.userId,
    );
    const unreadCount = await this.notificationsService.getUnreadCount(
      client.userId,
    );
    client.emit('unreadCount', { count: unreadCount });
    return { success: true };
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return { error: 'Not authenticated' };

    await this.notificationsService.markAllAsRead(client.userId);
    client.emit('unreadCount', { count: 0 });
    return { success: true };
  }

  // Called by other services to push notifications in real-time
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    // Also update unread count
    this.notificationsService.getUnreadCount(userId).then((count) => {
      this.server.to(`user:${userId}`).emit('unreadCount', { count });
    });
  }

  sendNotificationToUsers(userIds: string[], notification: any) {
    for (const userId of userIds) {
      this.sendNotificationToUser(userId, notification);
    }
  }
}
