import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AiChatService } from '../ai/ai-chat.service';
import { CreateMessageDto } from './dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private messagesService;
    private jwtService;
    private prisma;
    private notificationsService;
    private notificationsGateway;
    private aiChatService;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(messagesService: MessagesService, jwtService: JwtService, prisma: PrismaService, notificationsService: NotificationsService, notificationsGateway: NotificationsGateway, aiChatService: AiChatService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinGroup(client: AuthenticatedSocket, data: {
        groupId: string;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleLeaveGroup(client: AuthenticatedSocket, data: {
        groupId: string;
    }): {
        success: boolean;
    };
    handleSendMessage(client: AuthenticatedSocket, data: CreateMessageDto & {
        mentions?: string[];
    }): Promise<{
        success: boolean;
        message: {
            id: string;
            content: string;
            mentions: string[];
            createdAt: Date;
            updatedAt: Date;
            isEdited: boolean;
            groupId: string;
            authorId: string;
            replyToId: string | null;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        message?: undefined;
    }>;
    private handleBotMention;
    handleAddReaction(client: AuthenticatedSocket, data: {
        messageId: string;
        groupId: string;
        emoji: string;
    }): Promise<{
        success: boolean;
        reaction: {
            id: string;
            createdAt: Date;
            emoji: string;
            messageId: string;
            userId: string;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        reaction?: undefined;
    }>;
    handleRemoveReaction(client: AuthenticatedSocket, data: {
        messageId: string;
        groupId: string;
        emoji: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleGetHistory(client: AuthenticatedSocket, data: {
        groupId: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        messages: import(".prisma/client").Message[];
        nextCursor?: string;
        success: boolean;
        error?: undefined;
    } | {
        error: any;
    }>;
    handleEditMessage(client: AuthenticatedSocket, data: {
        messageId: string;
        groupId: string;
        content: string;
    }): Promise<{
        success: boolean;
        message: {
            id: string;
            content: string;
            mentions: string[];
            createdAt: Date;
            updatedAt: Date;
            isEdited: boolean;
            groupId: string;
            authorId: string;
            replyToId: string | null;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        message?: undefined;
    }>;
    handleDeleteMessage(client: AuthenticatedSocket, data: {
        messageId: string;
        groupId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleTyping(client: AuthenticatedSocket, data: {
        groupId: string;
        isTyping: boolean;
    }): void;
}
export {};
