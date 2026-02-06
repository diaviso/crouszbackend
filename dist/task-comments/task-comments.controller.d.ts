import { User } from '@prisma/client';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto';
export declare class TaskCommentsController {
    private readonly taskCommentsService;
    constructor(taskCommentsService: TaskCommentsService);
    create(dto: CreateTaskCommentDto, user: User): Promise<{
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
    findAllByTask(taskId: string, page?: string, limit?: string, user?: User): Promise<{
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
    delete(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        mentions: string[];
        authorId: string;
    }>;
}
