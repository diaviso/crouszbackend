import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(options: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async searchByEmail(query: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        email: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10,
    });
  }

  async getDashboardStats(userId: string) {
    const [
      myGroups,
      myTasks,
      recentActivity,
      tasksByStatus,
    ] = await Promise.all([
      // Groups count
      this.prisma.group.count({
        where: {
          OR: [
            { adminId: userId },
            { members: { some: { userId } } },
          ],
        },
      }),
      // Tasks assigned to user
      this.prisma.task.findMany({
        where: {
          assignees: { some: { userId } },
          status: { not: 'DONE' },
        },
        include: {
          project: { include: { group: true } },
          assignees: { include: { user: true } },
        },
        orderBy: { dueDate: { sort: 'asc', nulls: 'last' } },
        take: 10,
      }),
      // Recent activity: recent tasks updated across user's groups
      this.prisma.task.findMany({
        where: {
          project: {
            group: {
              OR: [
                { adminId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        },
        include: {
          project: { include: { group: true } },
          assignees: { include: { user: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      // Task status distribution across user's groups
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          project: {
            group: {
              OR: [
                { adminId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        },
        _count: true,
      }),
    ]);

    // Also get total projects count
    const totalProjects = await this.prisma.project.count({
      where: {
        group: {
          OR: [
            { adminId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
    });

    const statusMap: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const s of tasksByStatus) {
      statusMap[s.status] = s._count;
    }

    return {
      stats: {
        groups: myGroups,
        projects: totalProjects,
        tasksTotal: statusMap.TODO + statusMap.IN_PROGRESS + statusMap.DONE,
        tasksTodo: statusMap.TODO,
        tasksInProgress: statusMap.IN_PROGRESS,
        tasksDone: statusMap.DONE,
      },
      myTasks,
      recentActivity,
    };
  }

  async globalSearch(query: string, userId: string) {
    if (!query || query.length < 2) {
      return { groups: [], projects: [], tasks: [], users: [] };
    }

    const [groups, projects, tasks, users] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          AND: [
            {
              OR: [
                { adminId: userId },
                { members: { some: { userId } } },
                { isPublic: true },
              ],
            },
            {
              OR: [
                { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
          ],
        },
        include: { admin: true, _count: { select: { members: true, projects: true } } },
        take: 5,
      }),
      this.prisma.project.findMany({
        where: {
          AND: [
            {
              group: {
                OR: [
                  { adminId: userId },
                  { members: { some: { userId } } },
                  { isPublic: true },
                ],
              },
            },
            {
              OR: [
                { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
          ],
        },
        include: { group: true },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          AND: [
            {
              project: {
                group: {
                  OR: [
                    { adminId: userId },
                    { members: { some: { userId } } },
                    { isPublic: true },
                  ],
                },
              },
            },
            {
              OR: [
                { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
          ],
        },
        include: { project: { include: { group: true } } },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        take: 5,
      }),
    ]);

    return { groups, projects, tasks, users };
  }
}
