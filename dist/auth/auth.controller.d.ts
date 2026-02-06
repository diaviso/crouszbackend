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
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        googleId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
