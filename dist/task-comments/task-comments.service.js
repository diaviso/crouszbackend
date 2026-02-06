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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let TaskCommentsService = class TaskCommentsService {
    constructor(prisma, notificationsService, notificationsGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.notificationsGateway = notificationsGateway;
    }
    async verifyTaskAccess(taskId, userId) {
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
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        const group = task.project.group;
        if (group.adminId !== userId &&
            group.members.length === 0 &&
            !group.isPublic) {
            throw new common_1.ForbiddenException('You do not have access to this task');
        }
        return task;
    }
    async create(dto, userId) {
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
            this.notificationsGateway.sendNotificationToUser(assignee.userId, notification);
        }
        if (dto.mentions && dto.mentions.length > 0) {
            const mentionedNotAssigned = dto.mentions.filter((id) => id !== userId && !assignees.find((a) => a.userId === id));
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
                this.notificationsGateway.sendNotificationToUser(mentionedId, notification);
            }
        }
        return comment;
    }
    async findAllByTask(taskId, userId, options = {}) {
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
    async delete(commentId, userId) {
        const comment = await this.prisma.taskComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID ${commentId} not found`);
        }
        if (comment.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        return this.prisma.taskComment.delete({ where: { id: commentId } });
    }
};
exports.TaskCommentsService = TaskCommentsService;
exports.TaskCommentsService = TaskCommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        notifications_gateway_1.NotificationsGateway])
], TaskCommentsService);
//# sourceMappingURL=task-comments.service.js.map