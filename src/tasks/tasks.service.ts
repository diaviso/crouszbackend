import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Task, TaskStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MailService } from '../mail/mail.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private mailService: MailService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const { projectId, assigneeIds, dueDate, ...taskData } = createTaskDto;

    // Write operation: require membership
    await this.verifyProjectAccess(projectId, userId, true);

    // Verify all assignees are group members
    if (assigneeIds?.length) {
      await this.verifyAssigneesAreMembersOfGroup(projectId, assigneeIds);
    }

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignees: assigneeIds?.length
          ? {
              create: assigneeIds.map((id) => ({ userId: id })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: { user: true },
        },
        project: { include: { group: true } },
      },
    });

    // Notify assignees
    if (assigneeIds?.length) {
      const creator = await this.prisma.user.findUnique({ where: { id: userId } });
      const taskWithProject = task as any;
      
      for (const assigneeId of assigneeIds) {
        if (assigneeId === userId) continue;
        
        const notification = await this.notificationsService.create({
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `${creator?.name} assigned you to "${task.title}" in ${taskWithProject.project?.name}`,
          userId: assigneeId,
          data: { taskId: task.id, projectId },
        });
        this.notificationsGateway.sendNotificationToUser(assigneeId, notification);

        // Send email notification
        const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        if (assignee?.email) {
          try {
            await this.mailService.sendTaskAssignedEmail({
              assigneeEmail: assignee.email,
              assigneeName: assignee.name || assignee.email,
              taskTitle: task.title,
              taskId: task.id,
              projectName: taskWithProject.project?.name || 'Projet',
              projectId: projectId,
              groupName: taskWithProject.project?.group?.name || 'Groupe',
              groupId: taskWithProject.project?.groupId || '',
              assignedByName: creator?.name || 'Un membre',
              dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : undefined,
            });
          } catch (error) {
            console.error('Failed to send task assigned email:', error);
          }
        }
      }
    }

    return task;
  }

  async findAllByProject(
    projectId: string,
    userId: string,
    options: { page?: number; limit?: number; search?: string; status?: TaskStatus } = {},
  ): Promise<PaginatedResult<Task>> {
    await this.verifyProjectAccess(projectId, userId, false);

    const { page = 1, limit = 50, search, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignees: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: { user: true },
        },
        project: {
          include: { group: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.verifyProjectAccess(task.projectId, userId, false);

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Write operation: require membership
    await this.verifyProjectAccess(task.projectId, userId, true);

    // If status is being changed, only assignees can do it (if task has assignees)
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      const assigneeUserIds = (task as any).assignees?.map((a: any) => a.userId) || [];
      if (assigneeUserIds.length > 0 && !assigneeUserIds.includes(userId)) {
        throw new ForbiddenException('Only task assignees can update the task status');
      }
    }

    const { assigneeIds, dueDate, ...taskData } = updateTaskDto;

    // Verify all assignees are group members
    if (assigneeIds?.length) {
      await this.verifyAssigneesAreMembersOfGroup(task.projectId, assigneeIds);
    }

    // Update task with optional assignee updates
    if (assigneeIds !== undefined) {
      // Remove existing assignments and create new ones
      await this.prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      if (assigneeIds.length > 0) {
        await this.prisma.taskAssignment.createMany({
          data: assigneeIds.map((userId) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        assignees: {
          include: { user: true },
        },
        project: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    userId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Write operation: require membership
    await this.verifyProjectAccess(task.projectId, userId, true);

    // Only assignees can update task status (if task has assignees)
    const assigneeUserIds = (task as any).assignees?.map((a: any) => a.userId) || [];
    if (assigneeUserIds.length > 0 && !assigneeUserIds.includes(userId)) {
      throw new ForbiddenException('Only task assignees can update the task status');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignees: {
          include: { user: true },
        },
        project: true,
      },
    });

    // Notify assignees about status change
    const changer = await this.prisma.user.findUnique({ where: { id: userId } });
    const assigneeIds = (task as any).assignees?.map((a: any) => a.userId) || [];
    for (const assigneeId of assigneeIds) {
      if (assigneeId === userId) continue;
      const notification = await this.notificationsService.create({
        type: 'TASK_STATUS_CHANGED',
        title: 'Task status updated',
        message: `${changer?.name} changed "${task.title}" to ${status}`,
        userId: assigneeId,
        data: { taskId: id, status },
      });
      this.notificationsGateway.sendNotificationToUser(assigneeId, notification);
    }

    // Send email to all group members when task is completed
    if (status === TaskStatus.DONE) {
      const taskWithProject = await this.prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              group: {
                include: {
                  members: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      if (taskWithProject?.project?.group) {
        const group = taskWithProject.project.group;
        const allMembers = group.members.map((m) => m.user);
        
        // Also include the admin if not already in members
        const admin = await this.prisma.user.findUnique({ where: { id: group.adminId } });
        if (admin && !allMembers.find((m) => m.id === admin.id)) {
          allMembers.push(admin);
        }

        for (const member of allMembers) {
          if (!member.email) continue;
          
          try {
            await this.mailService.sendTaskCompletedEmail({
              recipientEmail: member.email,
              recipientName: member.name || member.email,
              taskTitle: task.title,
              taskId: id,
              projectName: taskWithProject.project.name,
              projectId: task.projectId,
              groupName: group.name,
              groupId: group.id,
              completedByName: changer?.name || 'Un membre',
            });
          } catch (error) {
            console.error('Failed to send task completed email:', error);
          }
        }
      }
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Write operation: require membership
    await this.verifyProjectAccess(task.projectId, userId, true);

    await this.prisma.task.delete({
      where: { id },
    });
  }

  async assignUser(taskId: string, assigneeId: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Write operation: require membership
    await this.verifyProjectAccess(task.projectId, userId, true);

    // Verify assignee is a member of the group
    await this.verifyAssigneesAreMembersOfGroup(task.projectId, [assigneeId]);

    // Check if already assigned
    const existingAssignment = await this.prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId: assigneeId } },
    });

    if (!existingAssignment) {
      await this.prisma.taskAssignment.create({
        data: { taskId, userId: assigneeId },
      });

      // Notify the assigned user
      if (assigneeId !== userId) {
        const assigner = await this.prisma.user.findUnique({ where: { id: userId } });
        const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        
        const notification = await this.notificationsService.create({
          type: 'TASK_ASSIGNED',
          title: 'Task assigned to you',
          message: `${assigner?.name} assigned you to "${task.title}"`,
          userId: assigneeId,
          data: { taskId },
        });
        this.notificationsGateway.sendNotificationToUser(assigneeId, notification);

        // Send email notification
        if (assignee?.email) {
          const taskWithProject = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { project: { include: { group: true } } },
          });
          
          try {
            await this.mailService.sendTaskAssignedEmail({
              assigneeEmail: assignee.email,
              assigneeName: assignee.name || assignee.email,
              taskTitle: task.title,
              taskId: taskId,
              projectName: taskWithProject?.project?.name || 'Projet',
              projectId: task.projectId,
              groupName: taskWithProject?.project?.group?.name || 'Groupe',
              groupId: taskWithProject?.project?.groupId || '',
              assignedByName: assigner?.name || 'Un membre',
              dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : undefined,
            });
          } catch (error) {
            console.error('Failed to send task assigned email:', error);
          }
        }
      }
    }

    return this.findOne(taskId, userId);
  }

  async unassignUser(taskId: string, assigneeId: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Write operation: require membership
    await this.verifyProjectAccess(task.projectId, userId, true);

    await this.prisma.taskAssignment.deleteMany({
      where: { taskId, userId: assigneeId },
    });

    return this.findOne(taskId, userId);
  }

  private async verifyProjectAccess(projectId: string, userId: string, requireMembership: boolean = false): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const group = project.group;
    const isMember = group.adminId === userId || group.members.length > 0;

    // For write operations, always require membership
    if (requireMembership && !isMember) {
      throw new ForbiddenException('Only group members can perform this action');
    }

    // For read operations, public groups allow access
    if (!requireMembership && group.isPublic) {
      return;
    }

    // Private groups require membership
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async verifyAssigneesAreMembersOfGroup(
    projectId: string,
    assigneeIds: string[],
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { group: true },
    });

    if (!project) return;

    const groupId = project.group.id;
    const adminId = project.group.adminId;

    for (const assigneeId of assigneeIds) {
      if (assigneeId === adminId) continue;

      const membership = await this.prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: assigneeId, groupId } },
      });

      if (!membership) {
        const user = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        throw new ForbiddenException(
          `User ${user?.name || assigneeId} is not a member of this group and cannot be assigned to tasks`,
        );
      }
    }
  }
}
