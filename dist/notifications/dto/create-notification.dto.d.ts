import { NotificationType } from '@prisma/client';
export declare class CreateNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: any;
}
