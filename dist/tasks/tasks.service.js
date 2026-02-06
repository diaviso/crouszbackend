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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const mail_service_1 = require("../mail/mail.service");
let TasksService = class TasksService {
    constructor(prisma, notificationsService, notificationsGateway, mailService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.notificationsGateway = notificationsGateway;
        this.mailService = mailService;
    }
    async create(createTaskDto, userId) {
        const { projectId, assigneeIds, dueDate, ...taskData } = createTaskDto;
        await this.verifyProjectAccess(projectId, userId, true);
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
        if (assigneeIds?.length) {
            const creator = await this.prisma.user.findUnique({ where: { id: userId } });
            const taskWithProject = task;
            for (const assigneeId of assigneeIds) {
                if (assigneeId === userId)
                    continue;
                const notification = await this.notificationsService.create({
                    type: 'TASK_ASSIGNED',
                    title: 'New task assigned',
                    message: `${creator?.name} assigned you to "${task.title}" in ${taskWithProject.project?.name}`,
                    userId: assigneeId,
                    data: { taskId: task.id, projectId },
                });
                this.notificationsGateway.sendNotificationToUser(assigneeId, notification);
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
                    }
                    catch (error) {
                        console.error('Failed to send task assigned email:', error);
                    }
                }
            }
        }
        return task;
    }
    async findAllByProject(projectId, userId, options = {}) {
        await this.verifyProjectAccess(projectId, userId, false);
        const { page = 1, limit = 50, search, status } = options;
        const skip = (page - 1) * limit;
        const where = {
            projectId,
            ...(status ? { status } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                        { description: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
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
    async findOne(id, userId) {
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
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, false);
        return task;
    }
    async update(id, updateTaskDto, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignees: true },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, true);
        if (updateTaskDto.status && updateTaskDto.status !== task.status) {
            const assigneeUserIds = task.assignees?.map((a) => a.userId) || [];
            if (assigneeUserIds.length > 0 && !assigneeUserIds.includes(userId)) {
                throw new common_1.ForbiddenException('Only task assignees can update the task status');
            }
        }
        const { assigneeIds, dueDate, ...taskData } = updateTaskDto;
        if (assigneeIds?.length) {
            await this.verifyAssigneesAreMembersOfGroup(task.projectId, assigneeIds);
        }
        if (assigneeIds !== undefined) {
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
    async updateStatus(id, status, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignees: true },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, true);
        const assigneeUserIds = task.assignees?.map((a) => a.userId) || [];
        if (assigneeUserIds.length > 0 && !assigneeUserIds.includes(userId)) {
            throw new common_1.ForbiddenException('Only task assignees can update the task status');
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
        const changer = await this.prisma.user.findUnique({ where: { id: userId } });
        const assigneeIds = task.assignees?.map((a) => a.userId) || [];
        for (const assigneeId of assigneeIds) {
            if (assigneeId === userId)
                continue;
            const notification = await this.notificationsService.create({
                type: 'TASK_STATUS_CHANGED',
                title: 'Task status updated',
                message: `${changer?.name} changed "${task.title}" to ${status}`,
                userId: assigneeId,
                data: { taskId: id, status },
            });
            this.notificationsGateway.sendNotificationToUser(assigneeId, notification);
        }
        if (status === client_1.TaskStatus.DONE) {
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
                const admin = await this.prisma.user.findUnique({ where: { id: group.adminId } });
                if (admin && !allMembers.find((m) => m.id === admin.id)) {
                    allMembers.push(admin);
                }
                for (const member of allMembers) {
                    if (!member.email)
                        continue;
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
                    }
                    catch (error) {
                        console.error('Failed to send task completed email:', error);
                    }
                }
            }
        }
        return updated;
    }
    async remove(id, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, true);
        await this.prisma.task.delete({
            where: { id },
        });
    }
    async assignUser(taskId, assigneeId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, true);
        await this.verifyAssigneesAreMembersOfGroup(task.projectId, [assigneeId]);
        const existingAssignment = await this.prisma.taskAssignment.findUnique({
            where: { taskId_userId: { taskId, userId: assigneeId } },
        });
        if (!existingAssignment) {
            await this.prisma.taskAssignment.create({
                data: { taskId, userId: assigneeId },
            });
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
                    }
                    catch (error) {
                        console.error('Failed to send task assigned email:', error);
                    }
                }
            }
        }
        return this.findOne(taskId, userId);
    }
    async unassignUser(taskId, assigneeId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        await this.verifyProjectAccess(task.projectId, userId, true);
        await this.prisma.taskAssignment.deleteMany({
            where: { taskId, userId: assigneeId },
        });
        return this.findOne(taskId, userId);
    }
    async verifyProjectAccess(projectId, userId, requireMembership = false) {
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
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const group = project.group;
        const isMember = group.adminId === userId || group.members.length > 0;
        if (requireMembership && !isMember) {
            throw new common_1.ForbiddenException('Only group members can perform this action');
        }
        if (!requireMembership && group.isPublic) {
            return;
        }
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this project');
        }
    }
    async verifyAssigneesAreMembersOfGroup(projectId, assigneeIds) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { group: true },
        });
        if (!project)
            return;
        const groupId = project.group.id;
        const adminId = project.group.adminId;
        for (const assigneeId of assigneeIds) {
            if (assigneeId === adminId)
                continue;
            const membership = await this.prisma.groupMember.findUnique({
                where: { userId_groupId: { userId: assigneeId, groupId } },
            });
            if (!membership) {
                const user = await this.prisma.user.findUnique({ where: { id: assigneeId } });
                throw new common_1.ForbiddenException(`User ${user?.name || assigneeId} is not a member of this group and cannot be assigned to tasks`);
            }
        }
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        notifications_gateway_1.NotificationsGateway,
        mail_service_1.MailService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map