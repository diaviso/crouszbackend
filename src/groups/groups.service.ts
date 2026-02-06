import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Group, GroupRole, User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MailService } from '../mail/mail.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private mailService: MailService,
  ) {}

  async create(createGroupDto: CreateGroupDto, userId: string): Promise<Group> {
    const group = await this.prisma.group.create({
      data: {
        ...createGroupDto,
        adminId: userId,
        members: {
          create: {
            userId: userId,
            role: GroupRole.ADMIN,
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

  async findAll(
    userId: string,
    options: { page?: number; limit?: number; search?: string; filter?: string } = {},
  ): Promise<PaginatedResult<Group>> {
    const { page = 1, limit = 20, search, filter } = options;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.GroupWhereInput = {
      OR: [
        { adminId: userId },
        { members: { some: { userId } } },
        { isPublic: true },
      ],
    };

    const where: Prisma.GroupWhereInput = {
      AND: [
        baseWhere,
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
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

  async findMyGroups(
    userId: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ): Promise<PaginatedResult<Group>> {
    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {
      AND: [
        { OR: [{ adminId: userId }, { members: { some: { userId } } }] },
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
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

  async findOne(id: string): Promise<Group> {
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
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async update(
    id: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.findOne(id);

    if (group.adminId !== userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: id } },
      });

      if (membership?.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can update the group');
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

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.findOne(id);

    if (group.adminId !== userId) {
      throw new ForbiddenException('Only the group creator can delete the group');
    }

    await this.prisma.group.delete({
      where: { id },
    });
  }

  async addMember(
    groupId: string,
    addMemberDto: AddMemberDto,
  ): Promise<Group> {
    const { userId, role = GroupRole.MEMBER } = addMemberDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if already a member
    const existingMember = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this group');
    }

    await this.prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role,
      },
    });

    // Notify the added user
    const group = await this.findOne(groupId);
    const notification = await this.notificationsService.create({
      type: 'GROUP_INVITE',
      title: 'Added to group',
      message: `You have been added to the group "${group.name}"`,
      userId,
      data: { groupId },
    });
    this.notificationsGateway.sendNotificationToUser(userId, notification);

    // Send email notification
    try {
      const groupWithAdmin = group as Group & { admin?: User };
      await this.mailService.sendGroupMemberAddedEmail({
        memberEmail: user.email,
        memberName: user.name || user.email,
        groupName: group.name,
        groupId: group.id,
        addedByName: groupWithAdmin.admin?.name || 'Un administrateur',
      });
    } catch (error) {
      console.error('Failed to send group member added email:', error);
    }

    return group;
  }

  async removeMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.findOne(groupId);

    // Cannot remove the group creator
    if (group.adminId === userId) {
      throw new ForbiddenException('Cannot remove the group creator');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    return this.findOne(groupId);
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.findOne(groupId);

    if (group.adminId === userId) {
      throw new ForbiddenException(
        'Group creator cannot leave. Transfer ownership or delete the group.',
      );
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    role: GroupRole,
  ): Promise<Group> {
    const group = await this.findOne(groupId);

    if (group.adminId === userId) {
      throw new ForbiddenException('Cannot change the role of the group creator');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.prisma.groupMember.update({
      where: { userId_groupId: { userId, groupId } },
      data: { role },
    });

    return this.findOne(groupId);
  }

  async transferOwnership(
    groupId: string,
    newOwnerId: string,
    currentUserId: string,
  ): Promise<Group> {
    const group = await this.findOne(groupId);

    if (group.adminId !== currentUserId) {
      throw new ForbiddenException('Only the group owner can transfer ownership');
    }

    if (newOwnerId === currentUserId) {
      throw new ForbiddenException('You are already the owner');
    }

    // Check new owner is a member
    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: newOwnerId, groupId } },
    });

    if (!membership) {
      throw new NotFoundException('Target user is not a member of this group');
    }

    // Transfer: update group admin + set new owner as ADMIN, old owner as MEMBER
    await this.prisma.$transaction([
      this.prisma.group.update({
        where: { id: groupId },
        data: { adminId: newOwnerId },
      }),
      this.prisma.groupMember.update({
        where: { userId_groupId: { userId: newOwnerId, groupId } },
        data: { role: GroupRole.ADMIN },
      }),
      this.prisma.groupMember.update({
        where: { userId_groupId: { userId: currentUserId, groupId } },
        data: { role: GroupRole.MEMBER },
      }),
    ]);

    return this.findOne(groupId);
  }

  async joinPublicGroup(groupId: string, userId: string): Promise<Group> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    if (!group.isPublic) {
      throw new ForbiddenException('This group is private. You need an invitation.');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this group');
    }

    await this.prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: GroupRole.MEMBER,
      },
    });

    return this.findOne(groupId);
  }
}
