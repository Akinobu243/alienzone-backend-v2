import { ProfileService } from './profile.service';
import { CreateAlienDTO } from './dto/profile.dto';
export declare class ProfileController {
    private profileService;
    constructor(profileService: ProfileService);
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
    createAlien(createAlienDTO: CreateAlienDTO, req: any): Promise<void>;
    getAliens(req: any): Promise<(import("@prisma/client/runtime").GetResult<{
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
    getCharacters(req: any): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        userId: number;
        characterId: number;
        inRaid: boolean;
    }, unknown, never> & {})[]>;
    getItems(req: any): Promise<(import("@prisma/client/runtime").GetResult<{
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
    awardDailyRewards(req: any): Promise<void>;
    updateStarBalance(password: string, walletAddress: string, amount: number): Promise<void>;
    getAllTraits(): Promise<{}>;
}
