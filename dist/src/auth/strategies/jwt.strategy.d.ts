import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
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
export {};
