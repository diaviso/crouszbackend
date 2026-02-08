import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    private notificationsService;
    server: Server;
    private userSockets;
    constructor(jwtService: JwtService, prisma: PrismaService, notificationsService: NotificationsService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        notificationId: string;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleMarkAllAsRead(client: AuthenticatedSocket): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    sendNotificationToUser(userId: string, notification: any): void;
    sendNotificationToUsers(userIds: string[], notification: any): void;
}
export {};
