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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const conversations_service_1 = require("./conversations.service");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
let ConversationsGateway = class ConversationsGateway {
    constructor(conversationsService, jwtService, prisma) {
        this.conversationsService = conversationsService;
        this.jwtService = jwtService;
        this.prisma = prisma;
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
            client.join(`user:${user.id}`);
            const conversations = await this.conversationsService.getConversations(user.id);
            for (const conv of conversations) {
                client.join(`conversation:${conv.id}`);
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
    async handleJoinConversation(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.conversationsService.getConversation(data.conversationId, client.userId);
            client.join(`conversation:${data.conversationId}`);
            return { success: true };
        }
        catch (error) {
            return { error: error.message || 'Failed to join conversation' };
        }
    }
    handleLeaveConversation(client, data) {
        client.leave(`conversation:${data.conversationId}`);
        return { success: true };
    }
    async handleSendDirectMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const { message, conversation } = await this.conversationsService.sendMessage(data, client.userId);
            this.server.to(`conversation:${data.conversationId}`).emit('newDirectMessage', message);
            for (const participant of conversation.participants) {
                if (participant.userId !== client.userId) {
                    this.server.to(`user:${participant.userId}`).emit('conversationUpdated', {
                        conversationId: data.conversationId,
                        lastMessage: message,
                    });
                }
            }
            return { success: true, message };
        }
        catch (error) {
            return { error: error.message || 'Failed to send message' };
        }
    }
    async handleGetDirectMessages(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const result = await this.conversationsService.getMessages(data.conversationId, client.userId, data.limit || 50, data.cursor);
            return { success: true, ...result };
        }
        catch (error) {
            return { error: error.message || 'Failed to get messages' };
        }
    }
    async handleEditDirectMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const updated = await this.conversationsService.updateMessage(data.messageId, data.content, client.userId);
            this.server.to(`conversation:${data.conversationId}`).emit('directMessageEdited', updated);
            return { success: true, message: updated };
        }
        catch (error) {
            return { error: error.message || 'Failed to edit message' };
        }
    }
    async handleDeleteDirectMessage(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.conversationsService.deleteMessage(data.messageId, client.userId);
            this.server.to(`conversation:${data.conversationId}`).emit('directMessageDeleted', {
                messageId: data.messageId,
            });
            return { success: true };
        }
        catch (error) {
            return { error: error.message || 'Failed to delete message' };
        }
    }
    async handleAddDirectReaction(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            const reaction = await this.conversationsService.addReaction(data.messageId, data.emoji, client.userId);
            this.server.to(`conversation:${data.conversationId}`).emit('directReactionAdded', {
                messageId: data.messageId,
                reaction,
            });
            return { success: true, reaction };
        }
        catch (error) {
            return { error: error.message || 'Failed to add reaction' };
        }
    }
    async handleRemoveDirectReaction(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.conversationsService.removeReaction(data.messageId, data.emoji, client.userId);
            this.server.to(`conversation:${data.conversationId}`).emit('directReactionRemoved', {
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
    async handleMarkAsRead(client, data) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }
        try {
            await this.conversationsService.markAsRead(data.conversationId, client.userId);
            return { success: true };
        }
        catch (error) {
            return { error: error.message || 'Failed to mark as read' };
        }
    }
    handleTyping(client, data) {
        if (!client.userId) {
            return;
        }
        client.to(`conversation:${data.conversationId}`).emit('userTyping', {
            conversationId: data.conversationId,
            userId: client.userId,
            isTyping: data.isTyping,
        });
    }
    sendToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
};
exports.ConversationsGateway = ConversationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ConversationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConversationsGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendDirectMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SendDirectMessageDto]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleSendDirectMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getDirectMessages'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleGetDirectMessages", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('editDirectMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleEditDirectMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteDirectMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleDeleteDirectMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('addDirectReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleAddDirectReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeDirectReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleRemoveDirectReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConversationsGateway.prototype, "handleTyping", null);
exports.ConversationsGateway = ConversationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/conversations',
    }),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], ConversationsGateway);
//# sourceMappingURL=conversations.gateway.js.map