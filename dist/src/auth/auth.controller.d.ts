import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any, res: Response): Promise<void>;
    getProfile(user: User): Promise<{
        id: string;
        email: string;
        googleId: string;
        name: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
        jobTitle: string | null;
        specialty: string | null;
        skills: string[];
        bio: string | null;
        phone: string | null;
        linkedin: string | null;
        documentHeader: string | null;
    }>;
}
