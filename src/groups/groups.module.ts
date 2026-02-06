import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupMemberGuard, GroupAdminGuard } from './guards';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMemberGuard, GroupAdminGuard],
  exports: [GroupsService, GroupMemberGuard, GroupAdminGuard],
})
export class GroupsModule {}
