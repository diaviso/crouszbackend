"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConversationsService = class ConversationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConversation(participantIds, creatorId) {
        const allParticipants = [...new Set([creatorId, ...participantIds])];
        if (allParticipants.length < 2) {
            throw new common_1.BadRequestException('A conversation requires at least 2 participants');
        }
        const existingConversation = await this.findExistingConversation(allParticipants);
        if (existingConversation) {
            return existingConversation;
        }
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
    async findExistingConversation(participantIds) {
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
        return conversations.find((conv) => conv.participants.length === participantIds.length);
    }
    async getConversations(userId) {
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
        const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
            const participant = conv.participants.find((p) => p.userId === userId);
            const unreadCount = await this.prisma.directMessage.count({
                where: {
                    conversationId: conv.id,
                    createdAt: { gt: participant?.lastReadAt || new Date(0) },
                    authorId: { not: userId },
                },
            });
            return { ...conv, unreadCount };
        }));
        return conversationsWithUnread;
    }
    async getConversation(conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: { user: true },
                },
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const isParticipant = conversation.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
            throw new common_1.ForbiddenException('You are not a participant of this conversation');
        }
        return conversation;
    }
    async getMessages(conversationId, userId, limit = 50, cursor) {
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
        let nextCursor;
        if (messages.length > limit) {
            const nextItem = messages.pop();
            nextCursor = nextItem?.id;
        }
        return {
            messages: messages.reverse(),
            nextCursor,
        };
    }
    async sendMessage(dto, userId) {
        const conversation = await this.getConversation(dto.conversationId, userId);
        if (dto.replyToId) {
            const replyToMessage = await this.prisma.directMessage.findUnique({
                where: { id: dto.replyToId },
            });
            if (!replyToMessage || replyToMessage.conversationId !== dto.conversationId) {
                throw new common_1.NotFoundException('Reply target message not found');
            }
        }
        const message = await this.prisma.directMessage.create({
            data: {
                content: dto.content,
                conversationId: dto.conversationId,
                authorId: userId,
                replyToId: dto.replyToId,
                attachments: dto.attachments && dto.attachments.length > 0 ? {
                    create: dto.attachments.map((att) => ({
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
        await this.prisma.conversation.update({
            where: { id: dto.conversationId },
            data: { updatedAt: new Date() },
        });
        return { message, conversation };
    }
    async updateMessage(messageId, content, userId) {
        const message = await this.prisma.directMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can edit this message');
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
    async deleteMessage(messageId, userId) {
        const message = await this.prisma.directMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can delete this message');
        }
        await this.prisma.directMessage.delete({
            where: { id: messageId },
        });
        return { conversationId: message.conversationId };
    }
    async addReaction(messageId, emoji, userId) {
        const message = await this.prisma.directMessage.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const isParticipant = message.conversation.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
            throw new common_1.ForbiddenException('You are not a participant of this conversation');
        }
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
    async removeReaction(messageId, emoji, userId) {
        await this.prisma.directMessageReaction.deleteMany({
            where: {
                messageId,
                userId,
                emoji,
            },
        });
    }
    async markAsRead(conversationId, userId) {
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
    async getOrCreateDirectConversation(userId, otherUserId) {
        const otherUser = await this.prisma.user.findUnique({
            where: { id: otherUserId },
        });
        if (!otherUser) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.createConversation([otherUserId], userId);
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map