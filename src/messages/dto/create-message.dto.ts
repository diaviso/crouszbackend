import { IsString, IsUUID, MinLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentDto {
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

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsUUID()
  groupId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class AddReactionDto {
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}

export class RemoveReactionDto {
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}
