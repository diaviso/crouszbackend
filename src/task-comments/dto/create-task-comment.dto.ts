import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateTaskCommentDto {
  @IsString()
  content: string;

  @IsString()
  taskId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}
