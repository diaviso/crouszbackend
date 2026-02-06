import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendDirectMessageDto, DirectMessageAttachmentDto } from './dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createConversation(participantIds: string[], creatorId: string) {
    // Ensure creator is included
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    if (allParticipants.length < 2) {
      throw new BadRequestException('A conversation requires at least 2 participants');
    }

    // Check if a conversation with exactly these participants already exists
    const existingConversation = await this.findExistingConversation(allParticipants);
    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: allParticipants.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { author: true },
        },
      },
    });
  }

  private async findExistingConversation(participantIds: string[]) {
    // Find conversations where all participants match
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: { in: participantIds },
          },
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    // Filter to find exact match (same number of participants)
    return conversations.find(
      (conv) => conv.participants.length === participantIds.length,
    );
  }

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { author: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: participant?.lastReadAt || new Date(0) },
            authorId: { not: userId },
          },
        });
        return { ...conv, unreadCount };
      }),
    );

    return conversationsWithUnread;
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return conversation;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    cursor?: string,
  ) {
    await this.getConversation(conversationId, userId);

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      include: {
        author: true,
        replyTo: {
          include: { author: true },
        },
        attachments: true,
        reactions: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    let nextCursor: string | undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return {
      messages: messages.reverse(),
      nextCursor,
    };
  }

  async sendMessage(dto: SendDirectMessageDto, userId: string) {
    const conversation = await this.getConversation(dto.conversationId, userId);

    // Verify replyTo message exists if provided
    if (dto.replyToId) {
      const replyToMessage = await this.prisma.directMessage.findUnique({
        where: { id: dto.replyToId },
      });
      if (!replyToMessage || replyToMessage.conversationId !== dto.conversationId) {
        throw new NotFoundException('Reply target message not found');
      }
    }

    const message = await this.prisma.directMessage.create({
      data: {
        content: dto.content,
        conversationId: dto.conversationId,
        authorId: userId,
        replyToId: dto.replyToId,
        attachments: dto.attachments && dto.attachments.length > 0 ? {
          create: dto.attachments.map((att: DirectMessageAttachmentDto) => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            url: att.url,
          })),
        } : undefined,
      },
      include: {
        author: true,
        replyTo: {
          include: { author: true },
        },
        attachments: true,
        reactions: {
          include: { user: true },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    return { message, conversation };
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this message');
    }

    return this.prisma.directMessage.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: {
        author: true,
        replyTo: {
          include: { author: true },
        },
        attachments: true,
        reactions: {
          include: { user: true },
        },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('Only the author can delete this message');
    }

    await this.prisma.directMessage.delete({
      where: { id: messageId },
    });

    return { conversationId: message.conversationId };
  }

  async addReaction(messageId: string, emoji: string, userId: string) {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Check if reaction already exists
    const existing = await this.prisma.directMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.directMessageReaction.create({
      data: {
        emoji,
        messageId,
        userId,
      },
      include: { user: true },
    });
  }

  async removeReaction(messageId: string, emoji: string, userId: string) {
    await this.prisma.directMessageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async getOrCreateDirectConversation(userId: string, otherUserId: string) {
    // Check if other user exists
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
    });

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    return this.createConversation([otherUserId], userId);
  }
}
