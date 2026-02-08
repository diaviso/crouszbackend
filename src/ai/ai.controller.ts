import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AiService } from './ai.service';
import { AiReportService } from './ai-report.service';
import { AiDocumentService } from './ai-document.service';
import { GenerateProjectDto } from './dto/generate-project.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiReportService: AiReportService,
    private readonly aiDocumentService: AiDocumentService,
  ) {}

  @Post('generate-project')
  async generateProject(
    @Body() dto: GenerateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.aiService.generateProject(dto.prompt, dto.groupId, user.id);
  }

  @Get('report/group/:groupId')
  async generateGroupReport(@Param('groupId') groupId: string) {
    return this.aiReportService.generateGroupReport(groupId);
  }

  @Get('report/project/:projectId')
  async generateProjectReport(@Param('projectId') projectId: string) {
    return this.aiReportService.generateProjectReport(projectId);
  }

  @Post('document/generate')
  async generateDocument(
    @Body() body: { prompt: string; context?: string },
  ) {
    const html = await this.aiDocumentService.generateDocument(body.prompt, body.context);
    return { html };
  }

  @Post('document/rewrite')
  async rewriteText(
    @Body() body: { text: string; instruction: string },
  ) {
    const html = await this.aiDocumentService.rewriteText(body.text, body.instruction);
    return { html };
  }

  @Post('document/continue')
  async continueWriting(
    @Body() body: { content: string; instruction?: string },
  ) {
    const html = await this.aiDocumentService.continueWriting(body.content, body.instruction);
    return { html };
  }
}
