import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateMessageDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
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

      // Track socket connections per user
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(client.id);

      // Join user to all their group rooms
      const memberships = await this.prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { groupId: true },
      });

      const ownedGroups = await this.prisma.group.findMany({
        where: { adminId: user.id },
        select: { id: true },
      });

      const groupIds = [
        ...memberships.map((m) => m.groupId),
        ...ownedGroups.map((g) => g.id),
      ];

      for (const groupId of groupIds) {
        client.join(`group:${groupId}`);
      }

      client.emit('connected', { userId: user.id });
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

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Verify membership
      const group = await this.prisma.group.findUnique({
        where: { id: data.groupId },
        include: {
          members: {
            where: { userId: client.userId },
          },
        },
      });

      if (!group) {
        return { error: 'Group not found' };
      }

      if (group.adminId !== client.userId && group.members.length === 0) {
        return { error: 'Not a member of this group' };
      }

      client.join(`group:${data.groupId}`);
      return { success: true };
    } catch {
      return { error: 'Failed to join group' };
    }
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string },
  ) {
    client.leave(`group:${data.groupId}`);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CreateMessageDto & { mentions?: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Parse @mentions from content if not provided
      let mentions = data.mentions || [];
      if (mentions.length === 0) {
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = mentionRegex.exec(data.content)) !== null) {
          mentions.push(match[2]); // capture the userId
        }
      }

      const message = await this.messagesService.create(
        { ...data, mentions },
        client.userId,
      );

      // Broadcast to all group members
      this.server.to(`group:${data.groupId}`).emit('newMessage', message);

      // Send notifications to mentioned users
      if (mentions.length > 0) {
        const author = await this.prisma.user.findUnique({
          where: { id: client.userId },
        });
        const group = await this.prisma.group.findUnique({
          where: { id: data.groupId },
        });

        for (const mentionedId of mentions) {
          if (mentionedId === client.userId) continue;
          const notification = await this.notificationsService.create({
            type: 'MESSAGE_MENTION',
            title: 'You were mentioned',
            message: `${author?.name} mentioned you in ${group?.name}`,
            userId: mentionedId,
            data: { groupId: data.groupId, messageId: message.id },
          });
          this.notificationsGateway.sendNotificationToUser(
            mentionedId,
            notification,
          );
        }
      }

      return { success: true, message };
    } catch (error: any) {
      return { error: error.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; groupId: string; emoji: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const reaction = await this.messagesService.addReaction(
        data.messageId,
        data.emoji,
        client.userId,
      );

      // Broadcast to all group members
      this.server.to(`group:${data.groupId}`).emit('reactionAdded', {
        messageId: data.messageId,
        reaction,
      });

      return { success: true, reaction };
    } catch (error: any) {
      return { error: error.message || 'Failed to add reaction' };
    }
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; groupId: string; emoji: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.messagesService.removeReaction(
        data.messageId,
        data.emoji,
        client.userId,
      );

      // Broadcast to all group members
      this.server.to(`group:${data.groupId}`).emit('reactionRemoved', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: client.userId,
      });

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to remove reaction' };
    }
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string; limit?: number; cursor?: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const result = await this.messagesService.findAllByGroup(
        data.groupId,
        client.userId,
        data.limit || 50,
        data.cursor,
      );

      return { success: true, ...result };
    } catch (error: any) {
      return { error: error.message || 'Failed to get history' };
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; groupId: string; content: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const updated = await this.messagesService.update(
        data.messageId,
        data.content,
        client.userId,
      );

      // Broadcast edit to all group members
      this.server.to(`group:${data.groupId}`).emit('messageEdited', updated);

      return { success: true, message: updated };
    } catch (error: any) {
      return { error: error.message || 'Failed to edit message' };
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; groupId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.messagesService.delete(data.messageId, client.userId);

      // Broadcast deletion to all group members
      this.server.to(`group:${data.groupId}`).emit('messageDeleted', {
        messageId: data.messageId,
      });

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete message' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { groupId: string; isTyping: boolean },
  ) {
    if (!client.userId) {
      return;
    }

    client.to(`group:${data.groupId}`).emit('userTyping', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }
}
