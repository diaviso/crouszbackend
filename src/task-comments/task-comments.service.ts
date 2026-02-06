import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTaskCommentDto } from './dto';

@Injectable()
export class TaskCommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  private async verifyTaskAccess(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            group: {
              include: {
                members: { where: { userId } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const group = task.project.group;
    if (
      group.adminId !== userId &&
      group.members.length === 0 &&
      !group.isPublic
    ) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async create(dto: CreateTaskCommentDto, userId: string) {
    const task = await this.verifyTaskAccess(dto.taskId, userId);

    const comment = await this.prisma.taskComment.create({
      data: {
        content: dto.content,
        mentions: dto.mentions || [],
        taskId: dto.taskId,
        authorId: userId,
      },
      include: {
        author: true,
      },
    });

    // Notify task assignees
    const assignees = await this.prisma.taskAssignment.findMany({
      where: { taskId: dto.taskId, userId: { not: userId } },
      select: { userId: true },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    for (const assignee of assignees) {
      const notification = await this.notificationsService.create({
        type: 'TASK_COMMENT',
        title: 'New comment on task',
        message: `${author?.name} commented on "${task.title}"`,
        userId: assignee.userId,
        data: {
          taskId: dto.taskId,
          projectId: task.projectId,
          groupId: task.project.groupId,
          commentId: comment.id,
        },
      });
      this.notificationsGateway.sendNotificationToUser(
        assignee.userId,
        notification,
      );
    }

    // Notify mentioned users
    if (dto.mentions && dto.mentions.length > 0) {
      const mentionedNotAssigned = dto.mentions.filter(
        (id) =>
          id !== userId && !assignees.find((a) => a.userId === id),
      );
      for (const mentionedId of mentionedNotAssigned) {
        const notification = await this.notificationsService.create({
          type: 'TASK_COMMENT',
          title: 'You were mentioned in a comment',
          message: `${author?.name} mentioned you in a comment on "${task.title}"`,
          userId: mentionedId,
          data: {
            taskId: dto.taskId,
            projectId: task.projectId,
            groupId: task.project.groupId,
            commentId: comment.id,
          },
        });
        this.notificationsGateway.sendNotificationToUser(
          mentionedId,
          notification,
        );
      }
    }

    return comment;
  }

  async findAllByTask(
    taskId: string,
    userId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    await this.verifyTaskAccess(taskId, userId);

    const [data, total] = await Promise.all([
      this.prisma.taskComment.findMany({
        where: { taskId },
        include: { author: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.taskComment.count({ where: { taskId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${commentId} not found`,
      );
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.taskComment.delete({ where: { id: commentId } });
  }
}
