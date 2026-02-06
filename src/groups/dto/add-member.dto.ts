import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { GroupRole } from '@prisma/client';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(GroupRole)
  role?: GroupRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(GroupRole)
  role: GroupRole;
}
