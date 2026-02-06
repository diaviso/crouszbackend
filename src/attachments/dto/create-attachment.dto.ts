import { IsUUID } from 'class-validator';

export class CreateAttachmentDto {
  @IsUUID()
  projectId: string;
}
