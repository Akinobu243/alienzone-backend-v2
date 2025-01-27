/// <reference types="multer" />
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlienDTO } from './dto/profile.dto';
export declare class ProfileService {
    private prisma;
    constructor(prisma: PrismaService);
    private s3;
    getProfile(walletAddress: string): Promise<{
        walletAddress: string;
        name: string;
        country: string;
        twitterId: string;
        image: string;
        level: number;
        experience: number;
        reputation: number;
        stars: number;
    }>;
    createAlien(walletAddress: string, createAlienDTO: CreateAlienDTO, image: Express.Multer.File): Promise<void>;
    getAliens(walletAddress: string): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        name: string;
        element: string;
        image: string;
        strengthPoints: number;
        userId: number;
        inRaid: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    getCharacters(walletAddress: string): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        userId: number;
        characterId: number;
        inRaid: boolean;
    }, unknown, never> & {})[]>;
    getItems(walletAddress: string): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        userId: number;
        itemId: number;
        quantity: number;
    }, unknown, never> & {})[]>;
    getLeaderboard(): Promise<{
        name: string;
        country: string;
        enterprise: string;
        image: string;
        level: number;
        experience: number;
        reputation: number;
    }[]>;
    awardDailyRewards(walletAddress: string): Promise<void>;
    updateStarBalance(walletAddress: string, amount: number): Promise<void>;
    getAllTraits(): Promise<{}>;
    useReferralCode(walletAddress: string, code: string): Promise<void>;
}
