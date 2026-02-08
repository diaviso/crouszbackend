import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { PaginatedResult } from '../common/dto';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProjectDto: CreateProjectDto, userId: string): Promise<Project>;
    findAllByGroup(groupId: string, userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResult<Project>>;
    findOne(id: string, userId: string): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project>;
    remove(id: string, userId: string): Promise<void>;
    private verifyGroupMembership;
    private verifyGroupAdmin;
}
