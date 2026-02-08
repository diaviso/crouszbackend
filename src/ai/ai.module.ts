import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiChatService } from './ai-chat.service';
import { AiReportService } from './ai-report.service';
import { AiDocumentService } from './ai-document.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiChatService, AiReportService, AiDocumentService],
  exports: [AiService, AiChatService, AiReportService, AiDocumentService],
})
export class AiModule {}
