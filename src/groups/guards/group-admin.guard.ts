import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GroupAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId || request.params.id;

    if (!groupId) {
      throw new NotFoundException('Group ID is required');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check if user is the group admin (creator)
    if (group.adminId === user.id) {
      request.group = group;
      return true;
    }

    // Check if user has ADMIN role in membership
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: groupId,
        },
      },
    });

    if (membership?.role === 'ADMIN') {
      request.group = group;
      return true;
    }

    throw new ForbiddenException('Only group admins can perform this action');
  }
}
