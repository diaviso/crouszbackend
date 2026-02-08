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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("./notifications.service");
let NotificationsGateway = class NotificationsGateway {
    constructor(jwtService, prisma, notificationsService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.notificationsService = notificationsService;
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
            const unreadCount = await this.notificationsService.getUnreadCount(user.id);
            client.emit('unreadCount', { count: unreadCount });
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
    async handleMarkAsRead(client, data) {
        if (!client.userId)
            return { error: 'Not authenticated' };
        await this.notificationsService.markAsRead(data.notificationId, client.userId);
        const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
        client.emit('unreadCount', { count: unreadCount });
        return { success: true };
    }
    async handleMarkAllAsRead(client) {
        if (!client.userId)
            return { error: 'Not authenticated' };
        await this.notificationsService.markAllAsRead(client.userId);
        client.emit('unreadCount', { count: 0 });
        return { success: true };
    }
    sendNotificationToUser(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification', notification);
        this.notificationsService.getUnreadCount(userId).then((count) => {
            this.server.to(`user:${userId}`).emit('unreadCount', { count });
        });
    }
    sendNotificationToUsers(userIds, notification) {
        for (const userId of userIds) {
            this.sendNotificationToUser(userId, notification);
        }
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAllAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkAllAsRead", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map