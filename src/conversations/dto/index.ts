import { IsString, IsUUID, MinLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}

export class DirectMessageAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsString()
  url: string;

  size: number;
}

export class SendDirectMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectMessageAttachmentDto)
  attachments?: DirectMessageAttachmentDto[];
}

export class UpdateDirectMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}

export class AddDirectMessageReactionDto {
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}
