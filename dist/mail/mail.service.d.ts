import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
interface GroupMemberAddedData {
    memberEmail: string;
    memberName: string;
    groupName: string;
    groupId: string;
    addedByName: string;
}
interface TaskAssignedData {
    assigneeEmail: string;
    assigneeName: string;
    taskTitle: string;
    taskId: string;
    projectName: string;
    projectId: string;
    groupName: string;
    groupId: string;
    assignedByName: string;
    dueDate?: string;
}
interface TaskCompletedData {
    recipientEmail: string;
    recipientName: string;
    taskTitle: string;
    taskId: string;
    projectName: string;
    projectId: string;
    groupName: string;
    groupId: string;
    completedByName: string;
}
export declare class MailService {
    private readonly mailerService;
    private readonly configService;
    private frontendUrl;
    constructor(mailerService: MailerService, configService: ConfigService);
    private getEmailTemplate;
    private getButton;
    sendTestEmail(to: string): Promise<void>;
    sendGroupMemberAddedEmail(data: GroupMemberAddedData): Promise<void>;
    sendTaskAssignedEmail(data: TaskAssignedData): Promise<void>;
    sendTaskCompletedEmail(data: TaskCompletedData): Promise<void>;
}
export {};
