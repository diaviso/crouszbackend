"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AttachmentsService = class AttachmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(file, projectId, userId) {
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
    async findAllByProject(projectId, userId, options = {}) {
        await this.verifyProjectAccess(projectId, userId, false);
        const { page = 1, limit = 20, search } = options;
        const skip = (page - 1) * limit;
        const where = {
            projectId,
            ...(search
                ? { originalName: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } }
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
    async findOne(id, userId) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
            include: {
                uploadedBy: true,
                project: true,
            },
        });
        if (!attachment) {
            throw new common_1.NotFoundException(`Attachment with ID ${id} not found`);
        }
        await this.verifyProjectAccess(attachment.projectId, userId, false);
        return attachment;
    }
    async getFilePath(id, userId) {
        const attachment = await this.findOne(id, userId);
        const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('File not found on disk');
        }
        return filePath;
    }
    async remove(id, userId) {
        const attachment = await this.findOne(id, userId);
        if (attachment.uploadedById !== userId) {
            await this.verifyGroupAdmin(attachment.projectId, userId);
        }
        const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        await this.prisma.attachment.delete({
            where: { id },
        });
    }
    async verifyProjectAccess(projectId, userId, requireMembership = false) {
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
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const group = project.group;
        const isMember = group.adminId === userId || group.members.length > 0;
        if (requireMembership && !isMember) {
            throw new common_1.ForbiddenException('Only group members can perform this action');
        }
        if (!requireMembership && group.isPublic) {
            return;
        }
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this project');
        }
    }
    async verifyGroupAdmin(projectId, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { group: true },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const group = project.group;
        if (group.adminId === userId) {
            return;
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId: group.id } },
        });
        if (membership?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only admins or the uploader can delete attachments');
        }
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map