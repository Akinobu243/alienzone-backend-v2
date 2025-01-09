import { PrismaService } from '../prisma/prisma.service';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
export declare class ItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    createItem(name: string, description: string, image: string): Promise<void>;
    editItem(id: number, name?: string, description?: string, image?: string): Promise<void>;
    deleteItem(id: number): Promise<void>;
    getAllItems(page?: number, limit?: number): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        name: string;
        description: string;
        image: string;
    }, unknown, never> & {})[]>;
    setDailyRewards(rewards: SetDailyRewardDto[]): Promise<void>;
    rewardItem(walletAddress: string, itemId: number): Promise<void>;
}
