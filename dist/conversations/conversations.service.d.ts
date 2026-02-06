import { PrismaService } from '../prisma/prisma.service';
import { SendDirectMessageDto } from './dto';
export declare class ConversationsService {
    private prisma;
    constructor(prisma: PrismaService);
    createConversation(participantIds: string[], creatorId: string): Promise<{
        participants: ({
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
            userId: string;
            joinedAt: Date;
            conversationId: string;
            lastReadAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private findExistingConversation;
    getConversations(userId: string): Promise<{
        unreadCount: number;
        messages: ({
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
        })[];
        participants: ({
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
            userId: string;
            joinedAt: Date;
            conversationId: string;
            lastReadAt: Date;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getConversation(conversationId: string, userId: string): Promise<{
        participants: ({
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
            userId: string;
            joinedAt: Date;
            conversationId: string;
            lastReadAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMessages(conversationId: string, userId: string, limit?: number, cursor?: string): Promise<{
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
    }>;
    sendMessage(dto: SendDirectMessageDto, userId: string): Promise<{
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
        conversation: {
            participants: ({
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
                userId: string;
                joinedAt: Date;
                conversationId: string;
                lastReadAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateMessage(messageId: string, content: string, userId: string): Promise<{
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
    }>;
    deleteMessage(messageId: string, userId: string): Promise<{
        conversationId: string;
    }>;
    addReaction(messageId: string, emoji: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        messageId: string;
        emoji: string;
    }>;
    removeReaction(messageId: string, emoji: string, userId: string): Promise<void>;
    markAsRead(conversationId: string, userId: string): Promise<void>;
    getOrCreateDirectConversation(userId: string, otherUserId: string): Promise<{
        participants: ({
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
            userId: string;
            joinedAt: Date;
            conversationId: string;
            lastReadAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
