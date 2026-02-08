import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string, search?: string): Promise<{
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
    globalSearch(query: string, user: User): Promise<{
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
    getMe(user: User): {
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
    getProfileCompleteness(user: User): {
        percentage: number;
        missingFields: string[];
    };
    search(query: string): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
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
    }>;
    updateMe(user: User, updateUserDto: UpdateUserDto): Promise<{
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
    }>;
    uploadAvatar(file: Express.Multer.File, user: User): Promise<{
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
    }>;
}
