import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface ReportData {
    generatedAt: string;
    type: string;
    title: string;
    summary: string;
    sections: ReportSection[];
}
export interface ReportSection {
    title: string;
    content: string;
    metrics?: Record<string, string | number>;
    items?: ReportItem[];
}
export interface ReportItem {
    label: string;
    value: string | number;
    status?: 'good' | 'warning' | 'danger';
}
export declare class AiReportService {
    private configService;
    private prisma;
    private readonly logger;
    private llm;
    constructor(configService: ConfigService, prisma: PrismaService);
    generateGroupReport(groupId: string): Promise<ReportData>;
    generateProjectReport(projectId: string): Promise<ReportData>;
    private getGroupDetails;
    private getGroupProjects;
    private getGroupMembers;
    private computeStats;
    private generateAIAnalysis;
    private generateProjectAIAnalysis;
}
