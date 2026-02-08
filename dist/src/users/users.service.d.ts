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
    getProfileCompleteness(user: User): {
        percentage: number;
        missingFields: string[];
    };
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
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isPublic: boolean;
                    adminId: string;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
            assignees: ({
                user: {
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
                userId: string;
                assignedAt: Date;
                taskId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            projectId: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
        })[];
        recentActivity: ({
            project: {
                group: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isPublic: boolean;
                    adminId: string;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
            assignees: ({
                user: {
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
                userId: string;
                assignedAt: Date;
                taskId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            projectId: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
        })[];
    }>;
    globalSearch(query: string, userId: string): Promise<{
        groups: ({
            admin: {
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
            _count: {
                members: number;
                projects: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isPublic: boolean;
            adminId: string;
        })[];
        projects: ({
            group: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isPublic: boolean;
                adminId: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            groupId: string;
        })[];
        tasks: ({
            project: {
                group: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isPublic: boolean;
                    adminId: string;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                groupId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            projectId: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
        })[];
        users: {
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
        }[];
    }>;
}
