import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
interface GoogleUserData {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateGoogleUser(userData: GoogleUserData): Promise<User>;
    login(user: User): Promise<{
        accessToken: string;
        user: User;
    }>;
    getProfile(userId: string): Promise<User | null>;
}
export {};
