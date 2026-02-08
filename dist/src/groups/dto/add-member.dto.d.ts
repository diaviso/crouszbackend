import { GroupRole } from '@prisma/client';
export declare class AddMemberDto {
    userId: string;
    role?: GroupRole;
}
export declare class UpdateMemberRoleDto {
    role: GroupRole;
}
