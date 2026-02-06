import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        type: NotificationType;
        title: string;
        message: string;
        userId: string;
        data?: any;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }>;
    createMany(notifications: {
        type: NotificationType;
        title: string;
        message: string;
        userId: string;
        data?: any;
    }[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    findAllByUser(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{
        data: {
            message: string;
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            title: string;
            type: import(".prisma/client").$Enums.NotificationType;
            read: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        unreadCount: number;
    }>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
}
