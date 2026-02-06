import { User } from '@prisma/client';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(createMessageDto: CreateMessageDto, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        content: string;
        mentions: string[];
        replyToId: string | null;
        isEdited: boolean;
        authorId: string;
    }>;
    findAllByGroup(groupId: string, limit: string, cursor: string, user: User): Promise<{
        messages: import(".prisma/client").Message[];
        nextCursor?: string;
    }>;
    remove(id: string, user: User): Promise<void>;
}
