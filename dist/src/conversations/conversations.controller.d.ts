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
        participants: ({
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
            joinedAt: Date;
            userId: string;
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
            joinedAt: Date;
            userId: string;
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
            joinedAt: Date;
            userId: string;
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
    }>;
    getOrCreateDirectConversation(user: {
        id: string;
    }, otherUserId: string): Promise<{
        participants: ({
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
            joinedAt: Date;
            userId: string;
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
