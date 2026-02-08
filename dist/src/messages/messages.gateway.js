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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const messages_service_1 = require("./messages.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const ai_chat_service_1 = require("../ai/ai-chat.service");
let MessagesGateway = MessagesGateway_1 = class MessagesGateway {
    constructor(messagesService, jwtService, prisma, notificationsService, notificationsGateway, aiChatService) {
        this.messagesService = messagesService;
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.notificationsGateway = notificationsGateway;
        this.aiChatService = aiChatService;
        this.logger = new common_1.Logger(MessagesGateway_1.name);
        this.userSockets = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
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
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
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
    async handleJoinGroup(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
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
        }
        catch {
            return { error: 'Failed to join group' };
        }
    }
    handleLeaveGroup(client, data) {
        client.leave(`group:${data.groupId}`);
        return { success: true };
    }
    async handleSendMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            let mentions = data.mentions || [];
            if (mentions.length === 0) {
                const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
                let match;
                while ((match = mentionRegex.exec(data.content)) !== null) {
                    mentions.push(match[2]);
                }
            }
            const message = await this.messagesService.create({ ...data, mentions }, client.userId);
            this.server.to(`group:${data.groupId}`).emit('newMessage', message);
            if (mentions.length > 0) {
                const author = await this.prisma.user.findUnique({
                    where: { id: client.userId },
                });
                const group = await this.prisma.group.findUnique({
                    where: { id: data.groupId },
                });
                for (const mentionedId of mentions) {
                    if (mentionedId === client.userId)
                        continue;
                    if (mentionedId === ai_chat_service_1.CROUSZ_AI_BOT_ID)
                        continue;
                    const notification = await this.notificationsService.create({
                        type: 'MESSAGE_MENTION',
                        title: 'You were mentioned',
                        message: `${author?.name} mentioned you in ${group?.name}`,
                        userId: mentionedId,
                        data: { groupId: data.groupId, messageId: message.id },
                    });
                    this.notificationsGateway.sendNotificationToUser(mentionedId, notification);
                }
            }
            this.handleBotMention(mentions, data.content, data.groupId, client.userId).catch((err) => {
                this.logger.error('CrouszAI response error:', err);
            });
            return { success: true, message };
        }
        catch (error) {
            return { error: error.message || 'Failed to send message' };
        }
    }
    async handleBotMention(mentions, content, groupId, authorId) {
        const isMentioned = this.aiChatService.isBotMentioned(mentions, content);
        if (!isMentioned)
            return;
        const author = await this.prisma.user.findUnique({ where: { id: authorId } });
        this.server.to(`group:${groupId}`).emit('userTyping', {
            userId: ai_chat_service_1.CROUSZ_AI_BOT_ID,
            isTyping: true,
        });
        const responseText = await this.aiChatService.generateResponse(groupId, content, author?.name || 'Utilisateur');
        this.server.to(`group:${groupId}`).emit('userTyping', {
            userId: ai_chat_service_1.CROUSZ_AI_BOT_ID,
            isTyping: false,
        });
        const botMessage = {
            id: `bot-${Date.now()}`,
            content: responseText,
            groupId,
            authorId: ai_chat_service_1.CROUSZ_AI_BOT_ID,
            author: {
                id: ai_chat_service_1.CROUSZ_AI_BOT_ID,
                name: ai_chat_service_1.CROUSZ_AI_BOT_NAME,
                email: 'crouszai@crousz.sn',
                avatar: null,
                jobTitle: 'Assistant IA',
            },
            mentions: [],
            reactions: [],
            attachments: [],
            replyTo: null,
            replyToId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.server.to(`group:${groupId}`).emit('newMessage', botMessage);
    }
    async handleAddReaction(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const reaction = await this.messagesService.addReaction(data.messageId, data.emoji, client.userId);
            this.server.to(`group:${data.groupId}`).emit('reactionAdded', {
                messageId: data.messageId,
                reaction,
            });
            return { success: true, reaction };
        }
        catch (error) {
            return { error: error.message || 'Failed to add reaction' };
        }
    }
    async handleRemoveReaction(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.messagesService.removeReaction(data.messageId, data.emoji, client.userId);
            this.server.to(`group:${data.groupId}`).emit('reactionRemoved', {
                messageId: data.messageId,
                emoji: data.emoji,
                userId: client.userId,
            });
            return { success: true };
        }
        catch (error) {
            return { error: error.message || 'Failed to remove reaction' };
        }
    }
    async handleGetHistory(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const result = await this.messagesService.findAllByGroup(data.groupId, client.userId, data.limit || 50, data.cursor);
            return { success: true, ...result };
        }
        catch (error) {
            return { error: error.message || 'Failed to get history' };
        }
    }
    async handleEditMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const updated = await this.messagesService.update(data.messageId, data.content, client.userId);
            this.server.to(`group:${data.groupId}`).emit('messageEdited', updated);
            return { success: true, message: updated };
        }
        catch (error) {
            return { error: error.message || 'Failed to edit message' };
        }
    }
    async handleDeleteMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.messagesService.delete(data.messageId, client.userId);
            this.server.to(`group:${data.groupId}`).emit('messageDeleted', {
                messageId: data.messageId,
            });
            return { success: true };
        }
        catch (error) {
            return { error: error.message || 'Failed to delete message' };
        }
    }
    handleTyping(client, data) {
        if (!client.userId) {
            return;
        }
        client.to(`group:${data.groupId}`).emit('userTyping', {
            userId: client.userId,
            isTyping: data.isTyping,
        });
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinGroup'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleJoinGroup", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveGroup'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleLeaveGroup", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('addReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleAddReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleRemoveReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getHistory'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleGetHistory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('editMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleTyping", null);
exports.MessagesGateway = MessagesGateway = MessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/messages',
    }),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        notifications_gateway_1.NotificationsGateway,
        ai_chat_service_1.AiChatService])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map