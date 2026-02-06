import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
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
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    searchByEmail(query: string): Promise<User[]>;
    getDashboardStats(userId: string): Promise<{
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
    globalSearch(query: string, userId: string): Promise<{
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
}
