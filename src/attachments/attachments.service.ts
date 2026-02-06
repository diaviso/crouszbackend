import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Attachment, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    projectId: string,
    userId: string,
  ): Promise<Attachment> {
    // Write operation: require membership
    await this.verifyProjectAccess(projectId, userId, true);

    return this.prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        projectId,
        uploadedById: userId,
      },
      include: {
        uploadedBy: true,
        project: true,
      },
    });
  }

  async findAllByProject(
    projectId: string,
    userId: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ): Promise<PaginatedResult<Attachment>> {
    await this.verifyProjectAccess(projectId, userId, false);

    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.AttachmentWhereInput = {
      projectId,
      ...(search
        ? { originalName: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.attachment.findMany({
        where,
        include: { uploadedBy: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attachment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string): Promise<Attachment> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        project: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    await this.verifyProjectAccess(attachment.projectId, userId, false);

    return attachment;
  }

  async getFilePath(id: string, userId: string): Promise<string> {
    const attachment = await this.findOne(id, userId);
    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return filePath;
  }

  async remove(id: string, userId: string): Promise<void> {
    const attachment = await this.findOne(id, userId);

    // Only the uploader or group admin can delete
    if (attachment.uploadedById !== userId) {
      await this.verifyGroupAdmin(attachment.projectId, userId);
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.attachment.delete({
      where: { id },
    });
  }

  private async verifyProjectAccess(projectId: string, userId: string, requireMembership: boolean = false): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const group = project.group;
    const isMember = group.adminId === userId || group.members.length > 0;

    if (requireMembership && !isMember) {
      throw new ForbiddenException('Only group members can perform this action');
    }

    if (!requireMembership && group.isPublic) {
      return;
    }

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async verifyGroupAdmin(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { group: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const group = project.group;

    if (group.adminId === userId) {
      return;
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });

    if (membership?.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins or the uploader can delete attachments');
    }
  }
}
