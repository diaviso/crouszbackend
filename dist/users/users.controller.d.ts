import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string, search?: string): Promise<{
        data: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
            googleId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDashboardStats(user: User): Promise<{
        stats: {
            groups: number;
            projects: number;
            tasksTotal: number;
            tasksTodo: number;
            tasksInProgress: number;
            tasksDone: number;
        };
        myTasks: ({
            project: {
                group: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isPublic: boolean;
                    adminId: string;
                    description: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
            assignees: ({
                user: {
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
                userId: string;
                assignedAt: Date;
                taskId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
            projectId: string;
        })[];
        recentActivity: ({
            project: {
                group: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isPublic: boolean;
                    adminId: string;
                    description: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
            assignees: ({
                user: {
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
                userId: string;
                assignedAt: Date;
                taskId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
            projectId: string;
        })[];
    }>;
    globalSearch(query: string, user: User): Promise<{
        groups: ({
            _count: {
                members: number;
                projects: number;
            };
            admin: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                googleId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isPublic: boolean;
            adminId: string;
            description: string | null;
        })[];
        projects: ({
            group: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isPublic: boolean;
                adminId: string;
                description: string | null;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            groupId: string;
        })[];
        tasks: ({
            project: {
                group: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isPublic: boolean;
                    adminId: string;
                    description: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
            projectId: string;
        })[];
        users: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
            googleId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getMe(user: User): {
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        googleId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    search(query: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        googleId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        googleId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMe(user: User, updateUserDto: UpdateUserDto): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        googleId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
