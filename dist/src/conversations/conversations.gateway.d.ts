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
                messageId: string;
                url: string;
            }[];
            replyTo: ({
                author: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                isEdited: boolean;
                replyToId: string | null;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                emoji: string;
                messageId: string;
            })[];
            author: {
                id: string;
                email: string;
                googleId: string;
                name: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
                jobTitle: string | null;
                specialty: string | null;
                skills: string[];
                bio: string | null;
                phone: string | null;
                linkedin: string | null;
                documentHeader: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isEdited: boolean;
            replyToId: string | null;
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
                messageId: string;
                url: string;
            }[];
            replyTo: ({
                author: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                isEdited: boolean;
                replyToId: string | null;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                emoji: string;
                messageId: string;
            })[];
            author: {
                id: string;
                email: string;
                googleId: string;
                name: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
                jobTitle: string | null;
                specialty: string | null;
                skills: string[];
                bio: string | null;
                phone: string | null;
                linkedin: string | null;
                documentHeader: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isEdited: boolean;
            replyToId: string | null;
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
                messageId: string;
                url: string;
            }[];
            replyTo: ({
                author: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                isEdited: boolean;
                replyToId: string | null;
                authorId: string;
                conversationId: string;
            }) | null;
            reactions: ({
                user: {
                    id: string;
                    email: string;
                    googleId: string;
                    name: string;
                    avatar: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    jobTitle: string | null;
                    specialty: string | null;
                    skills: string[];
                    bio: string | null;
                    phone: string | null;
                    linkedin: string | null;
                    documentHeader: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                emoji: string;
                messageId: string;
            })[];
            author: {
                id: string;
                email: string;
                googleId: string;
                name: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
                jobTitle: string | null;
                specialty: string | null;
                skills: string[];
                bio: string | null;
                phone: string | null;
                linkedin: string | null;
                documentHeader: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            isEdited: boolean;
            replyToId: string | null;
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
            emoji: string;
            messageId: string;
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
