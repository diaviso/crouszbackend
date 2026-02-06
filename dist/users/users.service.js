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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(options = {}) {
        const { page = 1, limit = 20, search } = options;
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            }
            : {};
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async update(id, updateUserDto) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });
    }
    async searchByEmail(query) {
        return this.prisma.user.findMany({
            where: {
                email: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            take: 10,
        });
    }
    async getDashboardStats(userId) {
        const [myGroups, myTasks, recentActivity, tasksByStatus,] = await Promise.all([
            this.prisma.group.count({
                where: {
                    OR: [
                        { adminId: userId },
                        { members: { some: { userId } } },
                    ],
                },
            }),
            this.prisma.task.findMany({
                where: {
                    assignees: { some: { userId } },
                    status: { not: 'DONE' },
                },
                include: {
                    project: { include: { group: true } },
                    assignees: { include: { user: true } },
                },
                orderBy: { dueDate: { sort: 'asc', nulls: 'last' } },
                take: 10,
            }),
            this.prisma.task.findMany({
                where: {
                    project: {
                        group: {
                            OR: [
                                { adminId: userId },
                                { members: { some: { userId } } },
                            ],
                        },
                    },
                },
                include: {
                    project: { include: { group: true } },
                    assignees: { include: { user: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 10,
            }),
            this.prisma.task.groupBy({
                by: ['status'],
                where: {
                    project: {
                        group: {
                            OR: [
                                { adminId: userId },
                                { members: { some: { userId } } },
                            ],
                        },
                    },
                },
                _count: true,
            }),
        ]);
        const totalProjects = await this.prisma.project.count({
            where: {
                group: {
                    OR: [
                        { adminId: userId },
                        { members: { some: { userId } } },
                    ],
                },
            },
        });
        const statusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
        for (const s of tasksByStatus) {
            statusMap[s.status] = s._count;
        }
        return {
            stats: {
                groups: myGroups,
                projects: totalProjects,
                tasksTotal: statusMap.TODO + statusMap.IN_PROGRESS + statusMap.DONE,
                tasksTodo: statusMap.TODO,
                tasksInProgress: statusMap.IN_PROGRESS,
                tasksDone: statusMap.DONE,
            },
            myTasks,
            recentActivity,
        };
    }
    async globalSearch(query, userId) {
        if (!query || query.length < 2) {
            return { groups: [], projects: [], tasks: [], users: [] };
        }
        const [groups, projects, tasks, users] = await Promise.all([
            this.prisma.group.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { adminId: userId },
                                { members: { some: { userId } } },
                                { isPublic: true },
                            ],
                        },
                        {
                            OR: [
                                { name: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                                { description: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                            ],
                        },
                    ],
                },
                include: { admin: true, _count: { select: { members: true, projects: true } } },
                take: 5,
            }),
            this.prisma.project.findMany({
                where: {
                    AND: [
                        {
                            group: {
                                OR: [
                                    { adminId: userId },
                                    { members: { some: { userId } } },
                                    { isPublic: true },
                                ],
                            },
                        },
                        {
                            OR: [
                                { name: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                                { description: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                            ],
                        },
                    ],
                },
                include: { group: true },
                take: 5,
            }),
            this.prisma.task.findMany({
                where: {
                    AND: [
                        {
                            project: {
                                group: {
                                    OR: [
                                        { adminId: userId },
                                        { members: { some: { userId } } },
                                        { isPublic: true },
                                    ],
                                },
                            },
                        },
                        {
                            OR: [
                                { title: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                                { description: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                            ],
                        },
                    ],
                },
                include: { project: { include: { group: true } } },
                take: 5,
            }),
            this.prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                        { email: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                    ],
                },
                take: 5,
            }),
        ]);
        return { groups, projects, tasks, users };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map