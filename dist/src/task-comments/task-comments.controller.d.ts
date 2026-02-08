import { User } from '@prisma/client';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto';
export declare class TaskCommentsController {
    private readonly taskCommentsService;
    constructor(taskCommentsService: TaskCommentsService);
    create(dto: CreateTaskCommentDto, user: User): Promise<{
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
    findAllByTask(taskId: string, page?: string, limit?: string, user?: User): Promise<{
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
