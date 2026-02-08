import { User } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: CreateProjectDto, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        groupId: string;
    }>;
    findAllByGroup(groupId: string, page?: string, limit?: string, search?: string, user?: User): Promise<import("../common/dto").PaginatedResult<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        groupId: string;
    }>>;
    findOne(id: string, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        groupId: string;
    }>;
    update(id: string, updateProjectDto: UpdateProjectDto, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        groupId: string;
    }>;
    remove(id: string, user: User): Promise<void>;
}
