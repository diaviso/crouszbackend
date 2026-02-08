import { IsString, IsUUID, MinLength } from 'class-validator';

export class GenerateProjectDto {
  @IsString()
  @MinLength(10)
  prompt: string;

  @IsUUID()
  groupId: string;
}
