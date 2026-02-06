import { Group, GroupRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MailService } from '../mail/mail.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';
import { PaginatedResult } from '../common/dto';
export declare class GroupsService {
    private prisma;
    private notificationsService;
    private notificationsGateway;
    private mailService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, notificationsGateway: NotificationsGateway, mailService: MailService);
    create(createGroupDto: CreateGroupDto, userId: string): Promise<Group>;
    findAll(userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        filter?: string;
    }): Promise<PaginatedResult<Group>>;
    findMyGroups(userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResult<Group>>;
    findOne(id: string): Promise<Group>;
    update(id: string, updateGroupDto: UpdateGroupDto, userId: string): Promise<Group>;
    remove(id: string, userId: string): Promise<void>;
    addMember(groupId: string, addMemberDto: AddMemberDto): Promise<Group>;
    removeMember(groupId: string, userId: string): Promise<Group>;
    leaveGroup(groupId: string, userId: string): Promise<void>;
    updateMemberRole(groupId: string, userId: string, role: GroupRole): Promise<Group>;
    transferOwnership(groupId: string, newOwnerId: string, currentUserId: string): Promise<Group>;
    joinPublicGroup(groupId: string, userId: string): Promise<Group>;
}
