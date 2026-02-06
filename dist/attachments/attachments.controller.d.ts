import { Response } from 'express';
import { User } from '@prisma/client';
import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    create(file: Express.Multer.File, projectId: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedById: string;
    }>;
    uploadFile(file: Express.Multer.File, user: User): {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
    };
    findAllByProject(projectId: string, page?: string, limit?: string, search?: string, user?: User): Promise<import("../common/dto").PaginatedResult<{
        id: string;
        createdAt: Date;
        projectId: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedById: string;
    }>>;
    serveFile(filename: string, res: Response): void;
    download(id: string, user: User, res: Response): Promise<void>;
    findOne(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedById: string;
    }>;
    remove(id: string, user: User): Promise<void>;
}
