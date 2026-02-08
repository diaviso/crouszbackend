import { PrismaService } from '../prisma/prisma.service';
import { SendDirectMessageDto } from './dto';
export declare class ConversationsService {
    private prisma;
    constructor(prisma: PrismaService);
    createConversation(participantIds: string[], creatorId: string): Promise<{
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
    private findExistingConversation;
    getConversations(userId: string): Promise<{
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
    getConversation(conversationId: string, userId: string): Promise<{
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
    getMessages(conversationId: string, userId: string, limit?: number, cursor?: string): Promise<{
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
    sendMessage(dto: SendDirectMessageDto, userId: string): Promise<{
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
        conversation: {
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
    }>;
    deleteMessage(messageId: string, userId: string): Promise<{
        conversationId: string;
    }>;
    addReaction(messageId: string, emoji: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        emoji: string;
        messageId: string;
    }>;
    removeReaction(messageId: string, emoji: string, userId: string): Promise<void>;
    markAsRead(conversationId: string, userId: string): Promise<void>;
    getOrCreateDirectConversation(userId: string, otherUserId: string): Promise<{
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
}
