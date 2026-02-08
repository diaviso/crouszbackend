import { ConfigService } from '@nestjs/config';
export declare class AiDocumentService {
    private configService;
    private readonly logger;
    private llm;
    constructor(configService: ConfigService);
    generateDocument(prompt: string, context?: string): Promise<string>;
    private cleanHtmlResponse;
    rewriteText(text: string, instruction: string): Promise<string>;
    continueWriting(existingContent: string, instruction?: string): Promise<string>;
}
