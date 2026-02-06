import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto';
export declare class ConversationsController {
    private conversationsService;
    constructor(conversationsService: ConversationsService);
    getConversations(user: {
        id: string;
    }): Promise<{
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
    createConversation(user: {
        id: string;
    }, dto: CreateConversationDto): Promise<{
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
    getConversation(user: {
        id: string;
    }, id: string): Promise<{
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
    getMessages(user: {
        id: string;
    }, id: string, limit?: string, cursor?: string): Promise<{
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
    getOrCreateDirectConversation(user: {
        id: string;
    }, otherUserId: string): Promise<{
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
    markAsRead(user: {
        id: string;
    }, id: string): Promise<{
        success: boolean;
    }>;
}
