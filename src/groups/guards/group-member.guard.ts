import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GroupMemberGuard implements CanActivate {
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
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Admin is always a member
    if (group.adminId === user.id) {
      request.group = group;
      request.isGroupAdmin = true;
      return true;
    }

    // Check if user is a member
    if (group.members.length === 0) {
      // If group is public, allow read access
      if (group.isPublic) {
        request.group = group;
        request.isGroupAdmin = false;
        return true;
      }
      throw new ForbiddenException('You are not a member of this group');
    }

    request.group = group;
    request.isGroupAdmin = group.members[0]?.role === 'ADMIN';
    return true;
  }
}
