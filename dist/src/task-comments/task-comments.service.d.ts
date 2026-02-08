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
            id: string;
            email: string;
            googleId: string;
            name: string;
            avatar: string | null;
            createdAt: Date;
            updatedAt: Date;
            jobTitle: string | null;
            specialty: string | null;
            skills: string[];
            bio: string | null;
            phone: string | null;
            linkedin: string | null;
            documentHeader: string | null;
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
                id: string;
                email: string;
                googleId: string;
                name: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
                jobTitle: string | null;
                specialty: string | null;
                skills: string[];
                bio: string | null;
                phone: string | null;
                linkedin: string | null;
                documentHeader: string | null;
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
