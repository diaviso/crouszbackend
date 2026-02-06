import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTaskCommentDto } from './dto';
export declare class TaskCommentsService {
    private prisma;
    private notificationsService;
    private notificationsGateway;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, notificationsGateway: NotificationsGateway);
    private verifyTaskAccess;
    create(dto: CreateTaskCommentDto, userId: string): Promise<{
        author: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
            googleId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        mentions: string[];
        authorId: string;
    }>;
    findAllByTask(taskId: string, userId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            author: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                googleId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            mentions: string[];
            authorId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    delete(commentId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        mentions: string[];
        authorId: string;
    }>;
}
