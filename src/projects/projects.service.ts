import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Project, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const { groupId, ...projectData } = createProjectDto;

    // Write operation: require actual membership even for public groups
    await this.verifyGroupMembership(groupId, userId, true);

    return this.prisma.project.create({
      data: {
        ...projectData,
        groupId,
      },
      include: {
        group: true,
        _count: {
          select: { tasks: true, attachments: true },
        },
      },
    });
  }

  async findAllByGroup(
    groupId: string,
    userId: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ): Promise<PaginatedResult<Project>> {
    await this.verifyGroupMembership(groupId, userId, false);

    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      groupId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          _count: { select: { tasks: true, attachments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        group: true,
        tasks: {
          include: {
            assignees: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: { uploadedBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.verifyGroupMembership(project.groupId, userId, false);

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Write operation: require actual membership
    await this.verifyGroupMembership(project.groupId, userId, true);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        group: true,
        _count: {
          select: { tasks: true, attachments: true },
        },
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Only group admin can delete projects
    await this.verifyGroupAdmin(project.groupId, userId);

    await this.prisma.project.delete({
      where: { id },
    });
  }

  private async verifyGroupMembership(
    groupId: string,
    userId: string,
    requireMembership: boolean = false,
  ): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isMember = group.adminId === userId || group.members.length > 0;

    // For write operations, always require membership
    if (requireMembership && !isMember) {
      throw new ForbiddenException('Only group members can perform this action');
    }

    // For read operations, public groups allow access to everyone
    if (!requireMembership && group.isPublic) {
      return;
    }

    // Private groups require membership for any operation
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  private async verifyGroupAdmin(groupId: string, userId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    if (group.adminId === userId) {
      return;
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (membership?.role !== 'ADMIN') {
      throw new ForbiddenException('Only group admins can perform this action');
    }
  }
}
