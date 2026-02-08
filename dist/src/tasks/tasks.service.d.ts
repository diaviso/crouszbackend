import { Task, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MailService } from '../mail/mail.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { PaginatedResult } from '../common/dto';
export declare class TasksService {
    private prisma;
    private notificationsService;
    private notificationsGateway;
    private mailService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, notificationsGateway: NotificationsGateway, mailService: MailService);
    create(createTaskDto: CreateTaskDto, userId: string): Promise<Task>;
    findAllByProject(projectId: string, userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: TaskStatus;
    }): Promise<PaginatedResult<Task>>;
    findOne(id: string, userId: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task>;
    updateStatus(id: string, status: TaskStatus, userId: string): Promise<Task>;
    remove(id: string, userId: string): Promise<void>;
    assignUser(taskId: string, assigneeId: string, userId: string): Promise<Task>;
    unassignUser(taskId: string, assigneeId: string, userId: string): Promise<Task>;
    private verifyProjectAccess;
    private verifyAssigneesAreMembersOfGroup;
}
