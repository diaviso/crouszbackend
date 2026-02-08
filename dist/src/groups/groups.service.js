"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const mail_service_1 = require("../mail/mail.service");
let GroupsService = class GroupsService {
    constructor(prisma, notificationsService, notificationsGateway, mailService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.notificationsGateway = notificationsGateway;
        this.mailService = mailService;
    }
    async create(createGroupDto, userId) {
        const group = await this.prisma.group.create({
            data: {
                ...createGroupDto,
                adminId: userId,
                members: {
                    create: {
                        userId: userId,
                        role: client_1.GroupRole.ADMIN,
                    },
                },
            },
            include: {
                admin: true,
                members: {
                    include: { user: true },
                },
            },
        });
        return group;
    }
    async findAll(userId, options = {}) {
        const { page = 1, limit = 20, search, filter } = options;
        const skip = (page - 1) * limit;
        const baseWhere = {
            OR: [
                { adminId: userId },
                { members: { some: { userId } } },
                { isPublic: true },
            ],
        };
        const where = {
            AND: [
                baseWhere,
                ...(search
                    ? [
                        {
                            OR: [
                                { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                                { description: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                            ],
                        },
                    ]
                    : []),
                ...(filter === 'public' ? [{ isPublic: true }] : []),
                ...(filter === 'private' ? [{ isPublic: false }] : []),
            ],
        };
        const [data, total] = await Promise.all([
            this.prisma.group.findMany({
                where,
                include: {
                    admin: true,
                    members: { include: { user: true } },
                    _count: { select: { members: true, projects: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.group.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findMyGroups(userId, options = {}) {
        const { page = 1, limit = 20, search } = options;
        const skip = (page - 1) * limit;
        const where = {
            AND: [
                { OR: [{ adminId: userId }, { members: { some: { userId } } }] },
                ...(search
                    ? [
                        {
                            OR: [
                                { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                                { description: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                            ],
                        },
                    ]
                    : []),
            ],
        };
        const [data, total] = await Promise.all([
            this.prisma.group.findMany({
                where,
                include: {
                    admin: true,
                    _count: { select: { members: true, projects: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.group.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                admin: true,
                members: {
                    include: { user: true },
                    orderBy: { joinedAt: 'asc' },
                },
                projects: {
                    include: {
                        _count: { select: { tasks: true, attachments: true } },
                    },
                },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group with ID ${id} not found`);
        }
        return group;
    }
    async update(id, updateGroupDto, userId) {
        const group = await this.findOne(id);
        if (group.adminId !== userId) {
            const membership = await this.prisma.groupMember.findUnique({
                where: { userId_groupId: { userId, groupId: id } },
            });
            if (membership?.role !== 'ADMIN') {
                throw new common_1.ForbiddenException('Only admins can update the group');
            }
        }
        return this.prisma.group.update({
            where: { id },
            data: updateGroupDto,
            include: {
                admin: true,
                members: {
                    include: { user: true },
                },
            },
        });
    }
    async remove(id, userId) {
        const group = await this.findOne(id);
        if (group.adminId !== userId) {
            throw new common_1.ForbiddenException('Only the group creator can delete the group');
        }
        await this.prisma.group.delete({
            where: { id },
        });
    }
    async addMember(groupId, addMemberDto) {
        const { userId, role = client_1.GroupRole.MEMBER } = addMemberDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const existingMember = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (existingMember) {
            throw new common_1.ConflictException('User is already a member of this group');
        }
        await this.prisma.groupMember.create({
            data: {
                userId,
                groupId,
                role,
            },
        });
        const group = await this.findOne(groupId);
        const notification = await this.notificationsService.create({
            type: 'GROUP_INVITE',
            title: 'Added to group',
            message: `You have been added to the group "${group.name}"`,
            userId,
            data: { groupId },
        });
        this.notificationsGateway.sendNotificationToUser(userId, notification);
        try {
            const groupWithAdmin = group;
            await this.mailService.sendGroupMemberAddedEmail({
                memberEmail: user.email,
                memberName: user.name || user.email,
                groupName: group.name,
                groupId: group.id,
                addedByName: groupWithAdmin.admin?.name || 'Un administrateur',
            });
        }
        catch (error) {
            console.error('Failed to send group member added email:', error);
        }
        return group;
    }
    async removeMember(groupId, userId) {
        const group = await this.findOne(groupId);
        if (group.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot remove the group creator');
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
            throw new common_1.NotFoundException('User is not a member of this group');
        }
        await this.prisma.groupMember.delete({
            where: { userId_groupId: { userId, groupId } },
        });
        return this.findOne(groupId);
    }
    async leaveGroup(groupId, userId) {
        const group = await this.findOne(groupId);
        if (group.adminId === userId) {
            throw new common_1.ForbiddenException('Group creator cannot leave. Transfer ownership or delete the group.');
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
            throw new common_1.NotFoundException('You are not a member of this group');
        }
        await this.prisma.groupMember.delete({
            where: { userId_groupId: { userId, groupId } },
        });
    }
    async updateMemberRole(groupId, userId, role) {
        const group = await this.findOne(groupId);
        if (group.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot change the role of the group creator');
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
            throw new common_1.NotFoundException('User is not a member of this group');
        }
        await this.prisma.groupMember.update({
            where: { userId_groupId: { userId, groupId } },
            data: { role },
        });
        return this.findOne(groupId);
    }
    async transferOwnership(groupId, newOwnerId, currentUserId) {
        const group = await this.findOne(groupId);
        if (group.adminId !== currentUserId) {
            throw new common_1.ForbiddenException('Only the group owner can transfer ownership');
        }
        if (newOwnerId === currentUserId) {
            throw new common_1.ForbiddenException('You are already the owner');
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: newOwnerId, groupId } },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Target user is not a member of this group');
        }
        await this.prisma.$transaction([
            this.prisma.group.update({
                where: { id: groupId },
                data: { adminId: newOwnerId },
            }),
            this.prisma.groupMember.update({
                where: { userId_groupId: { userId: newOwnerId, groupId } },
                data: { role: client_1.GroupRole.ADMIN },
            }),
            this.prisma.groupMember.update({
                where: { userId_groupId: { userId: currentUserId, groupId } },
                data: { role: client_1.GroupRole.MEMBER },
            }),
        ]);
        return this.findOne(groupId);
    }
    async joinPublicGroup(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        if (!group.isPublic) {
            throw new common_1.ForbiddenException('This group is private. You need an invitation.');
        }
        const existingMember = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (existingMember) {
            throw new common_1.ConflictException('You are already a member of this group');
        }
        await this.prisma.groupMember.create({
            data: {
                userId,
                groupId,
                role: client_1.GroupRole.MEMBER,
            },
        });
        return this.findOne(groupId);
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        notifications_gateway_1.NotificationsGateway,
        mail_service_1.MailService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map