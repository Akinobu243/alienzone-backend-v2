import { RewardType } from '@prisma/client';
export declare class RaidReward {
    type: RewardType;
    amount: number;
}
export declare class CreateRaidDTO {
    title: string;
    icon: string;
    image: string;
    description: string;
    duration: number;
    rewards: RaidReward[];
}
export declare class EditRaidDTO {
    raidId: number;
    title: string;
    icon: string;
    image: string;
    description: string;
    duration: number;
    rewards: RaidReward[];
}
export declare class LaunchRaidDTO {
    raidId: number;
    alienIds: number[];
    characterIds: number[];
}
