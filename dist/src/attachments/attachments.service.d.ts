import { Attachment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/dto';
export declare class AttachmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(file: Express.Multer.File, projectId: string, userId: string): Promise<Attachment>;
    findAllByProject(projectId: string, userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResult<Attachment>>;
    findOne(id: string, userId: string): Promise<Attachment>;
    getFilePath(id: string, userId: string): Promise<string>;
    remove(id: string, userId: string): Promise<void>;
    private verifyProjectAccess;
    private verifyGroupAdmin;
}
