import { User, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
    findAllByProject(projectId: string, page?: string, limit?: string, search?: string, status?: TaskStatus, user?: User): Promise<import("../common/dto").PaginatedResult<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>>;
    findOne(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
    update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
    updateStatus(id: string, status: TaskStatus, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
    remove(id: string, user: User): Promise<void>;
    assignUser(id: string, assigneeId: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
    unassignUser(id: string, assigneeId: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        dueDate: Date | null;
    }>;
}
