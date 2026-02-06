import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @CurrentUser() user: User) {
    return this.messagesService.create(createMessageDto, user.id);
  }

  @Get()
  findAllByGroup(
    @Query('groupId') groupId: string,
    @Query('limit') limit: string,
    @Query('cursor') cursor: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.findAllByGroup(
      groupId,
      user.id,
      limit ? parseInt(limit, 10) : 50,
      cursor,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.delete(id, user.id);
  }
}
