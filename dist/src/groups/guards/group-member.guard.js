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
exports.GroupMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let GroupMemberGuard = class GroupMemberGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const groupId = request.params.groupId || request.params.id;
        if (!groupId) {
            throw new common_1.NotFoundException('Group ID is required');
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
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        if (group.adminId === user.id) {
            request.group = group;
            request.isGroupAdmin = true;
            return true;
        }
        if (group.members.length === 0) {
            if (group.isPublic) {
                request.group = group;
                request.isGroupAdmin = false;
                return true;
            }
            throw new common_1.ForbiddenException('You are not a member of this group');
        }
        request.group = group;
        request.isGroupAdmin = group.members[0]?.role === 'ADMIN';
        return true;
    }
};
exports.GroupMemberGuard = GroupMemberGuard;
exports.GroupMemberGuard = GroupMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupMemberGuard);
//# sourceMappingURL=group-member.guard.js.map