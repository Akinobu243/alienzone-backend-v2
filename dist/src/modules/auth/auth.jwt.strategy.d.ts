import { Strategy } from 'passport-jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: User): Promise<User>;
}
export {};
