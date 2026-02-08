import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private configService;
    private prisma;
    private readonly logger;
    private llm;
    constructor(configService: ConfigService, prisma: PrismaService);
    generateProject(prompt: string, groupId: string, userId: string): Promise<{
        project: any;
        tasksCount: number;
    }>;
    private getGroupMembers;
    private callLLM;
}
