import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare const CROUSZ_AI_BOT_ID = "crouszai-bot";
export declare const CROUSZ_AI_BOT_NAME = "CrouszAI";
export declare class AiChatService implements OnModuleInit {
    private configService;
    private prisma;
    private readonly logger;
    private llm;
    private botUserId;
    constructor(configService: ConfigService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    getBotUserId(): string;
    isBotMentioned(mentions: string[], content: string): boolean;
    generateResponse(groupId: string, messageContent: string, authorName: string): Promise<string>;
    private getGroupContext;
    private getRecentMessages;
    private getGroupProjects;
    private buildSystemPrompt;
    private buildChatHistory;
    private cleanMentions;
}
