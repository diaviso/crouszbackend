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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createMessageDto, userId) {
        const { groupId, content, mentions, replyToId, attachments } = createMessageDto;
        await this.verifyGroupMembership(groupId, userId);
        if (replyToId) {
            const replyToMessage = await this.prisma.message.findUnique({
                where: { id: replyToId },
            });
            if (!replyToMessage || replyToMessage.groupId !== groupId) {
                throw new common_1.NotFoundException('Reply target message not found');
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
                    create: attachments.map((att) => ({
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
    async findAllByGroup(groupId, userId, limit = 50, cursor) {
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
    async update(id, content, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id },
        });
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${id} not found`);
        }
        if (message.authorId !== userId) {
            throw new common_1.ForbiddenException('Only the author can edit this message');
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
    async addReaction(messageId, emoji, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${messageId} not found`);
        }
        await this.verifyGroupMembership(message.groupId, userId);
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
    async removeReaction(messageId, emoji, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${messageId} not found`);
        }
        await this.prisma.messageReaction.deleteMany({
            where: {
                messageId,
                userId,
                emoji,
            },
        });
    }
    async getMessageReactions(messageId) {
        return this.prisma.messageReaction.findMany({
            where: { messageId },
            include: { user: true },
        });
    }
    async delete(id, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: { group: true },
        });
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${id} not found`);
        }
        if (message.authorId !== userId) {
            const isAdmin = await this.isGroupAdmin(message.groupId, userId);
            if (!isAdmin) {
                throw new common_1.ForbiddenException('Only the author or admin can delete this message');
            }
        }
        await this.prisma.message.delete({
            where: { id },
        });
    }
    async verifyGroupMembership(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        if (group.adminId !== userId && group.members.length === 0) {
            throw new common_1.ForbiddenException('You are not a member of this group');
        }
    }
    async isGroupAdmin(groupId, userId) {
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map