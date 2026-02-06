export declare class AttachmentDto {
    filename: string;
    originalName: string;
    mimeType: string;
    url: string;
    size: number;
}
export declare class CreateMessageDto {
    content: string;
    groupId: string;
    mentions?: string[];
    replyToId?: string;
    attachments?: AttachmentDto[];
}
export declare class AddReactionDto {
    messageId: string;
    emoji: string;
}
export declare class RemoveReactionDto {
    messageId: string;
    emoji: string;
}
