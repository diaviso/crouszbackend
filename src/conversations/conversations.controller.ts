import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  async getConversations(@CurrentUser() user: { id: string }) {
    return this.conversationsService.getConversations(user.id);
  }

  @Post()
  async createConversation(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation(dto.participantIds, user.id);
  }

  @Get(':id')
  async getConversation(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.conversationsService.getConversation(id, user.id);
  }

  @Get(':id/messages')
  async getMessages(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.getMessages(
      id,
      user.id,
      limit ? parseInt(limit, 10) : 50,
      cursor,
    );
  }

  @Post('direct/:userId')
  async getOrCreateDirectConversation(
    @CurrentUser() user: { id: string },
    @Param('userId') otherUserId: string,
  ) {
    return this.conversationsService.getOrCreateDirectConversation(user.id, otherUserId);
  }

  @Post(':id/read')
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.conversationsService.markAsRead(id, user.id);
    return { success: true };
  }
}
