import { User } from '@prisma/client';
import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    create(body: {
        title: string;
        content?: string;
    }, user: User): Promise<{
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
    findAll(user: User): Promise<({
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
    getHeader(user: User): Promise<{
        header: string | null;
    }>;
    updateHeader(body: {
        header: string;
    }, user: User): Promise<{
        id: string;
        documentHeader: string | null;
    }>;
    findOne(id: string, user: User): Promise<{
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
    update(id: string, body: {
        title?: string;
        content?: string;
    }, user: User): Promise<{
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
    delete(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        title: string;
    }>;
    share(id: string, body: {
        userId: string;
        canEdit?: boolean;
    }, user: User): Promise<{
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
    unshare(id: string, targetUserId: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        canEdit: boolean;
        documentId: string;
    }>;
}
