export declare class CreateConversationDto {
    participantIds: string[];
}
export declare class DirectMessageAttachmentDto {
    filename: string;
    originalName: string;
    mimeType: string;
    url: string;
    size: number;
}
export declare class SendDirectMessageDto {
    conversationId: string;
    content: string;
    replyToId?: string;
    attachments?: DirectMessageAttachmentDto[];
}
export declare class UpdateDirectMessageDto {
    content: string;
}
export declare class AddDirectMessageReactionDto {
    messageId: string;
    emoji: string;
}
