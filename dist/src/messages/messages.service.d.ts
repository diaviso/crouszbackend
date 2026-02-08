import { Message, MessageReaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto';
export declare class MessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createMessageDto: CreateMessageDto, userId: string): Promise<Message>;
    findAllByGroup(groupId: string, userId: string, limit?: number, cursor?: string): Promise<{
        messages: Message[];
        nextCursor?: string;
    }>;
    update(id: string, content: string, userId: string): Promise<Message>;
    addReaction(messageId: string, emoji: string, userId: string): Promise<MessageReaction>;
    removeReaction(messageId: string, emoji: string, userId: string): Promise<void>;
    getMessageReactions(messageId: string): Promise<MessageReaction[]>;
    delete(id: string, userId: string): Promise<void>;
    private verifyGroupMembership;
    private isGroupAdmin;
}
