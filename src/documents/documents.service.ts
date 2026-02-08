import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(title: string, content: string, userId: string) {
    return this.prisma.document.create({
      data: { title, content, authorId: userId },
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true } },
        shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.document.findMany({
      where: {
        OR: [
          { authorId: userId },
          { shares: { some: { userId } } },
        ],
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true } },
        shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true, documentHeader: true } },
        shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // Check access: author or shared user
    const isAuthor = doc.authorId === userId;
    const isShared = doc.shares.some((s) => s.userId === userId);
    if (!isAuthor && !isShared) throw new ForbiddenException('Access denied');

    return doc;
  }

  async update(id: string, userId: string, data: { title?: string; content?: string }) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const isAuthor = doc.authorId === userId;
    const share = doc.shares.find((s) => s.userId === userId);
    if (!isAuthor && (!share || !share.canEdit)) {
      throw new ForbiddenException('You do not have edit access');
    }

    return this.prisma.document.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true } },
        shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.authorId !== userId) throw new ForbiddenException('Only the author can delete');

    return this.prisma.document.delete({ where: { id } });
  }

  async share(documentId: string, userId: string, targetUserId: string, canEdit: boolean) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.authorId !== userId) throw new ForbiddenException('Only the author can share');
    if (targetUserId === userId) throw new ForbiddenException('Cannot share with yourself');

    // Check target user exists
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const share = await this.prisma.documentShare.upsert({
      where: { documentId_userId: { documentId, userId: targetUserId } },
      create: { documentId, userId: targetUserId, canEdit },
      update: { canEdit },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
    });

    return share;
  }

  async unshare(documentId: string, userId: string, targetUserId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.authorId !== userId) throw new ForbiddenException('Only the author can unshare');

    return this.prisma.documentShare.delete({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });
  }

  // Update user's document header/letterhead
  async updateDocumentHeader(userId: string, header: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { documentHeader: header },
      select: { id: true, documentHeader: true },
    });
  }

  async getDocumentHeader(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { documentHeader: true },
    });
    return user?.documentHeader || null;
  }
}
