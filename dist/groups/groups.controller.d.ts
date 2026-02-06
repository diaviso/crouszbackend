import { User } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, UpdateMemberRoleDto } from './dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    create(createGroupDto: CreateGroupDto, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    findAll(user: User, page?: string, limit?: string, search?: string, filter?: string): Promise<import("../common/dto").PaginatedResult<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>>;
    findMyGroups(user: User, page?: string, limit?: string, search?: string): Promise<import("../common/dto").PaginatedResult<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    update(id: string, updateGroupDto: UpdateGroupDto, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    remove(id: string, user: User): Promise<void>;
    addMember(id: string, addMemberDto: AddMemberDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    removeMember(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    updateMemberRole(id: string, userId: string, updateMemberRoleDto: UpdateMemberRoleDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    transferOwnership(id: string, newOwnerId: string, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
    leave(id: string, user: User): Promise<void>;
    join(id: string, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPublic: boolean;
        adminId: string;
    }>;
}
