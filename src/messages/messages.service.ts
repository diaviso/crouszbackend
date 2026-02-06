import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Message, MessageReaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, AttachmentDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, userId: string): Promise<Message> {
    const { groupId, content, mentions, replyToId, attachments } = createMessageDto;

    // Verify user is member of the group
    await this.verifyGroupMembership(groupId, userId);

    // Verify replyTo message exists if provided
    if (replyToId) {
      const replyToMessage = await this.prisma.message.findUnique({
        where: { id: replyToId },
      });
      if (!replyToMessage || replyToMessage.groupId !== groupId) {
        throw new NotFoundException('Reply target message not found');
      }
    }

    return this.prisma.message.create({
      data: {
        content,
        mentions: mentions || [],
        groupId,
        authorId: userId,
        replyToId,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map((att: AttachmentDto) => ({
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
        group: true,
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

  async findAllByGroup(
    groupId: string,
    userId: string,
    limit = 50,
    cursor?: string,
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    await this.verifyGroupMembership(groupId, userId);

    const messages = await this.prisma.message.findMany({
      where: { groupId },
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

  async update(id: string, content: string, userId: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this message');
    }

    return this.prisma.message.update({
      where: { id },
      data: { content, isEdited: true },
      include: {
        author: true,
        group: true,
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

  async addReaction(messageId: string, emoji: string, userId: string): Promise<MessageReaction> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.verifyGroupMembership(message.groupId, userId);

    // Check if reaction already exists
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.messageReaction.create({
      data: {
        emoji,
        messageId,
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return this.prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: true },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Only author or group admin can delete
    if (message.authorId !== userId) {
      const isAdmin = await this.isGroupAdmin(message.groupId, userId);
      if (!isAdmin) {
        throw new ForbiddenException('Only the author or admin can delete this message');
      }
    }

    await this.prisma.message.delete({
      where: { id },
    });
  }

  private async verifyGroupMembership(groupId: string, userId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check if admin or member
    if (group.adminId !== userId && group.members.length === 0) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  private async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return false;
    }

    if (group.adminId === userId) {
      return true;
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    return membership?.role === 'ADMIN';
  }
}
