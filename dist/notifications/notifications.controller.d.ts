import { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: User, page?: string, limit?: string, unreadOnly?: string): Promise<{
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
    getUnreadCount(user: User): Promise<{
        count: number;
    }>;
    markAsRead(id: string, user: User): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(user: User): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
