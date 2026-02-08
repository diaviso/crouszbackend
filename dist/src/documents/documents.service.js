"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(title, content, userId) {
        return this.prisma.document.create({
            data: { title, content, authorId: userId },
            include: {
                author: { select: { id: true, name: true, avatar: true, email: true } },
                shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
            },
        });
    }
    async findAllByUser(userId) {
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
    async findOne(id, userId) {
        const doc = await this.prisma.document.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, avatar: true, email: true, documentHeader: true } },
                shares: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
            },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const isAuthor = doc.authorId === userId;
        const isShared = doc.shares.some((s) => s.userId === userId);
        if (!isAuthor && !isShared)
            throw new common_1.ForbiddenException('Access denied');
        return doc;
    }
    async update(id, userId, data) {
        const doc = await this.prisma.document.findUnique({
            where: { id },
            include: { shares: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const isAuthor = doc.authorId === userId;
        const share = doc.shares.find((s) => s.userId === userId);
        if (!isAuthor && (!share || !share.canEdit)) {
            throw new common_1.ForbiddenException('You do not have edit access');
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
    async delete(id, userId) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.authorId !== userId)
            throw new common_1.ForbiddenException('Only the author can delete');
        return this.prisma.document.delete({ where: { id } });
    }
    async share(documentId, userId, targetUserId, canEdit) {
        const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.authorId !== userId)
            throw new common_1.ForbiddenException('Only the author can share');
        if (targetUserId === userId)
            throw new common_1.ForbiddenException('Cannot share with yourself');
        const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new common_1.NotFoundException('User not found');
        const share = await this.prisma.documentShare.upsert({
            where: { documentId_userId: { documentId, userId: targetUserId } },
            create: { documentId, userId: targetUserId, canEdit },
            update: { canEdit },
            include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        });
        return share;
    }
    async unshare(documentId, userId, targetUserId) {
        const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.authorId !== userId)
            throw new common_1.ForbiddenException('Only the author can unshare');
        return this.prisma.documentShare.delete({
            where: { documentId_userId: { documentId, userId: targetUserId } },
        });
    }
    async updateDocumentHeader(userId, header) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { documentHeader: header },
            select: { id: true, documentHeader: true },
        });
    }
    async getDocumentHeader(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { documentHeader: true },
        });
        return user?.documentHeader || null;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map