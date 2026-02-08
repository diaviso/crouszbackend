import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(
    @Body() body: { title: string; content?: string },
    @CurrentUser() user: User,
  ) {
    return this.documentsService.create(body.title, body.content || '', user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.documentsService.findAllByUser(user.id);
  }

  @Get('header')
  async getHeader(@CurrentUser() user: User) {
    const header = await this.documentsService.getDocumentHeader(user.id);
    return { header };
  }

  @Put('header')
  async updateHeader(
    @Body() body: { header: string },
    @CurrentUser() user: User,
  ) {
    return this.documentsService.updateDocumentHeader(user.id, body.header);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string },
    @CurrentUser() user: User,
  ) {
    return this.documentsService.update(id, user.id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.delete(id, user.id);
  }

  @Post(':id/share')
  async share(
    @Param('id') id: string,
    @Body() body: { userId: string; canEdit?: boolean },
    @CurrentUser() user: User,
  ) {
    return this.documentsService.share(id, user.id, body.userId, body.canEdit ?? false);
  }

  @Delete(':id/share/:userId')
  async unshare(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.unshare(id, user.id, targetUserId);
  }
}
