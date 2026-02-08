import { User } from '@prisma/client';
import { AiService } from './ai.service';
import { AiReportService } from './ai-report.service';
import { AiDocumentService } from './ai-document.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
export declare class AiController {
    private readonly aiService;
    private readonly aiReportService;
    private readonly aiDocumentService;
    constructor(aiService: AiService, aiReportService: AiReportService, aiDocumentService: AiDocumentService);
    generateProject(dto: GenerateProjectDto, user: User): Promise<{
        project: any;
        tasksCount: number;
    }>;
    generateGroupReport(groupId: string): Promise<import("./ai-report.service").ReportData>;
    generateProjectReport(projectId: string): Promise<import("./ai-report.service").ReportData>;
    generateDocument(body: {
        prompt: string;
        context?: string;
    }): Promise<{
        html: string;
    }>;
    rewriteText(body: {
        text: string;
        instruction: string;
    }): Promise<{
        html: string;
    }>;
    continueWriting(body: {
        content: string;
        instruction?: string;
    }): Promise<{
        html: string;
    }>;
}
