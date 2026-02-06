import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendDirectMessageDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/conversations',
})
export class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private conversationsService: ConversationsService,
    private jwtService: JwtService,
    private prisma: PrismaService,
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

      // Join user to their personal room for receiving DMs
      client.join(`user:${user.id}`);

      // Join all conversation rooms
      const conversations = await this.conversationsService.getConversations(user.id);
      for (const conv of conversations) {
        client.join(`conversation:${conv.id}`);
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

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.conversationsService.getConversation(data.conversationId, client.userId);
      client.join(`conversation:${data.conversationId}`);
      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to join conversation' };
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('sendDirectMessage')
  async handleSendDirectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendDirectMessageDto,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const { message, conversation } = await this.conversationsService.sendMessage(
        data,
        client.userId,
      );

      // Broadcast to all conversation participants
      this.server.to(`conversation:${data.conversationId}`).emit('newDirectMessage', message);

      // Also notify participants who might not be in the conversation room
      for (const participant of conversation.participants) {
        if (participant.userId !== client.userId) {
          this.server.to(`user:${participant.userId}`).emit('conversationUpdated', {
            conversationId: data.conversationId,
            lastMessage: message,
          });
        }
      }

      return { success: true, message };
    } catch (error: any) {
      return { error: error.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('getDirectMessages')
  async handleGetDirectMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; limit?: number; cursor?: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const result = await this.conversationsService.getMessages(
        data.conversationId,
        client.userId,
        data.limit || 50,
        data.cursor,
      );

      return { success: true, ...result };
    } catch (error: any) {
      return { error: error.message || 'Failed to get messages' };
    }
  }

  @SubscribeMessage('editDirectMessage')
  async handleEditDirectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string; content: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const updated = await this.conversationsService.updateMessage(
        data.messageId,
        data.content,
        client.userId,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('directMessageEdited', updated);

      return { success: true, message: updated };
    } catch (error: any) {
      return { error: error.message || 'Failed to edit message' };
    }
  }

  @SubscribeMessage('deleteDirectMessage')
  async handleDeleteDirectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.conversationsService.deleteMessage(data.messageId, client.userId);

      this.server.to(`conversation:${data.conversationId}`).emit('directMessageDeleted', {
        messageId: data.messageId,
      });

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete message' };
    }
  }

  @SubscribeMessage('addDirectReaction')
  async handleAddDirectReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string; emoji: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const reaction = await this.conversationsService.addReaction(
        data.messageId,
        data.emoji,
        client.userId,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('directReactionAdded', {
        messageId: data.messageId,
        reaction,
      });

      return { success: true, reaction };
    } catch (error: any) {
      return { error: error.message || 'Failed to add reaction' };
    }
  }

  @SubscribeMessage('removeDirectReaction')
  async handleRemoveDirectReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string; emoji: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.conversationsService.removeReaction(
        data.messageId,
        data.emoji,
        client.userId,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('directReactionRemoved', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: client.userId,
      });

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to remove reaction' };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.conversationsService.markAsRead(data.conversationId, client.userId);
      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to mark as read' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) {
      return;
    }

    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  // Helper to send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
