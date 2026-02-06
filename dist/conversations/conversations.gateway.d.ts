import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendDirectMessageDto } from './dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
}
export declare class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private conversationsService;
    private jwtService;
    private prisma;
    server: Server;
    private userSockets;
    constructor(conversationsService: ConversationsService, jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinConversation(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleLeaveConversation(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): {
        success: boolean;
    };
    handleSendDirectMessage(client: AuthenticatedSocket, data: SendDirectMessageDto): Promise<{
        success: boolean;
        message: {
            attachments: {
                id: string;
                createdAt: Date;
                filename: string;
                originalName: string;
                mimeType: string;
                size: number;
                url: string;
                messageId: string;
            }[];
            author: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                googleId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            replyTo: ({
                author: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                replyToId: string | null;
                isEdited: boolean;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                messageId: string;
                emoji: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            replyToId: string | null;
            isEdited: boolean;
            authorId: string;
            conversationId: string;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        message?: undefined;
    }>;
    handleGetDirectMessages(client: AuthenticatedSocket, data: {
        conversationId: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        messages: ({
            attachments: {
                id: string;
                createdAt: Date;
                filename: string;
                originalName: string;
                mimeType: string;
                size: number;
                url: string;
                messageId: string;
            }[];
            author: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                googleId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            replyTo: ({
                author: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                replyToId: string | null;
                isEdited: boolean;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                messageId: string;
                emoji: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            replyToId: string | null;
            isEdited: boolean;
            authorId: string;
            conversationId: string;
        })[];
        nextCursor: string | undefined;
        success: boolean;
        error?: undefined;
    } | {
        error: any;
    }>;
    handleEditDirectMessage(client: AuthenticatedSocket, data: {
        messageId: string;
        conversationId: string;
        content: string;
    }): Promise<{
        success: boolean;
        message: {
            attachments: {
                id: string;
                createdAt: Date;
                filename: string;
                originalName: string;
                mimeType: string;
                size: number;
                url: string;
                messageId: string;
            }[];
            author: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                googleId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            replyTo: ({
                author: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                replyToId: string | null;
                isEdited: boolean;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    name: string;
                    id: string;
                    email: string;
                    avatar: string | null;
                    googleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                messageId: string;
                emoji: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            replyToId: string | null;
            isEdited: boolean;
            authorId: string;
            conversationId: string;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        message?: undefined;
    }>;
    handleDeleteDirectMessage(client: AuthenticatedSocket, data: {
        messageId: string;
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleAddDirectReaction(client: AuthenticatedSocket, data: {
        messageId: string;
        conversationId: string;
        emoji: string;
    }): Promise<{
        success: boolean;
        reaction: {
            id: string;
            createdAt: Date;
            userId: string;
            messageId: string;
            emoji: string;
        };
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        reaction?: undefined;
    }>;
    handleRemoveDirectReaction(client: AuthenticatedSocket, data: {
        messageId: string;
        conversationId: string;
        emoji: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleTyping(client: AuthenticatedSocket, data: {
        conversationId: string;
        isTyping: boolean;
    }): void;
    sendToUser(userId: string, event: string, data: any): void;
}
export {};
