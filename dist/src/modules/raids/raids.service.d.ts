import { RewardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RaidReward } from './dto/raids.dto';
export declare class RaidsService {
    private prisma;
    constructor(prisma: PrismaService);
    getRaidsList(): Promise<({
        rewards: (import("@prisma/client/runtime").GetResult<{
            id: number;
            type: RewardType;
            amount: number;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
    } & import("@prisma/client/runtime").GetResult<{
        id: number;
        title: string;
        description: string;
        duration: number;
        icon: string;
        image: string;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    createRaid(title: string, description: string, duration: number, icon: string, image: string, rewards: RaidReward[]): Promise<void>;
    editRaid(raidId: number, title: string, description: string, duration: number, rewards: RaidReward[]): Promise<void>;
    launchRaid(raidId: number, alienIds: number[], characterIds: number[], userWalletAddress: string): Promise<import("@prisma/client/runtime").GetResult<{
        id: number;
        raidId: number;
        userId: number;
        inProgress: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {}>;
    getRaidHistory(userWalletAddress: string): Promise<({
        aliens: (import("@prisma/client/runtime").GetResult<{
            id: number;
            name: string;
            element: string;
            image: string;
            strengthPoints: number;
            userId: number;
            inRaid: boolean;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
    } & import("@prisma/client/runtime").GetResult<{
        id: number;
        raidId: number;
        userId: number;
        inProgress: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    processRaidRewards(): Promise<void>;
}
