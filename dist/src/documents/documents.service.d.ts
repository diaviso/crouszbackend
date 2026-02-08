import { PrismaService } from '../prisma/prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(title: string, content: string, userId: string): Promise<{
        author: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
        shares: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            canEdit: boolean;
            documentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    }>;
    findAllByUser(userId: string): Promise<({
        author: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
        shares: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            canEdit: boolean;
            documentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        author: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
            documentHeader: string | null;
        };
        shares: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            canEdit: boolean;
            documentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    }>;
    update(id: string, userId: string, data: {
        title?: string;
        content?: string;
    }): Promise<{
        author: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
        shares: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            canEdit: boolean;
            documentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    }>;
    delete(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    }>;
    share(documentId: string, userId: string, targetUserId: string, canEdit: boolean): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        canEdit: boolean;
        documentId: string;
    }>;
    unshare(documentId: string, userId: string, targetUserId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        canEdit: boolean;
        documentId: string;
    }>;
    updateDocumentHeader(userId: string, header: string): Promise<{
        id: string;
        documentHeader: string | null;
    }>;
    getDocumentHeader(userId: string): Promise<string | null>;
}
