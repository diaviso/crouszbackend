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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProjectDto, userId) {
        const { groupId, ...projectData } = createProjectDto;
        await this.verifyGroupMembership(groupId, userId, true);
        return this.prisma.project.create({
            data: {
                ...projectData,
                groupId,
            },
            include: {
                group: true,
                _count: {
                    select: { tasks: true, attachments: true },
                },
            },
        });
    }
    async findAllByGroup(groupId, userId, options = {}) {
        await this.verifyGroupMembership(groupId, userId, false);
        const { page = 1, limit = 20, search } = options;
        const skip = (page - 1) * limit;
        const where = {
            groupId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                        { description: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    ],
                }
                : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                include: {
                    _count: { select: { tasks: true, attachments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.project.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                group: true,
                tasks: {
                    include: {
                        assignees: {
                            include: { user: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    include: { uploadedBy: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        await this.verifyGroupMembership(project.groupId, userId, false);
        return project;
    }
    async update(id, updateProjectDto, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        await this.verifyGroupMembership(project.groupId, userId, true);
        return this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
            include: {
                group: true,
                _count: {
                    select: { tasks: true, attachments: true },
                },
            },
        });
    }
    async remove(id, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: { group: true },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        await this.verifyGroupAdmin(project.groupId, userId);
        await this.prisma.project.delete({
            where: { id },
        });
    }
    async verifyGroupMembership(groupId, userId, requireMembership = false) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        const isMember = group.adminId === userId || group.members.length > 0;
        if (requireMembership && !isMember) {
            throw new common_1.ForbiddenException('Only group members can perform this action');
        }
        if (!requireMembership && group.isPublic) {
            return;
        }
        if (!isMember) {
            throw new common_1.ForbiddenException('You are not a member of this group');
        }
    }
    async verifyGroupAdmin(groupId, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        if (group.adminId === userId) {
            return;
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (membership?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only group admins can perform this action');
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map