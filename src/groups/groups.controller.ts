import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, UpdateMemberRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupMemberGuard, GroupAdminGuard } from './guards';
import { CurrentUser } from '../common/decorators';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto, @CurrentUser() user: User) {
    return this.groupsService.create(createGroupDto, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.groupsService.findAll(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      filter,
    });
  }

  @Get('my')
  findMyGroups(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.groupsService.findMyGroups(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  @Get(':id')
  @UseGuards(GroupMemberGuard)
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(GroupAdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.update(id, updateGroupDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.groupsService.remove(id, user.id);
  }

  // Member management
  @Post(':id/members')
  @UseGuards(GroupAdminGuard)
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.groupsService.addMember(id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(GroupAdminGuard)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(id, userId);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(GroupAdminGuard)
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(id, userId, updateMemberRoleDto.role);
  }

  @Post(':id/transfer-ownership')
  transferOwnership(
    @Param('id') id: string,
    @Body('newOwnerId') newOwnerId: string,
    @CurrentUser() user: User,
  ) {
    return this.groupsService.transferOwnership(id, newOwnerId, user.id);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: User) {
    return this.groupsService.leaveGroup(id, user.id);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: User) {
    return this.groupsService.joinPublicGroup(id, user.id);
  }
}
