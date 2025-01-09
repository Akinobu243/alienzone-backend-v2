import { DailyRewardType } from '@prisma/client';
export declare class SetDailyRewardDto {
    day: number;
    type: DailyRewardType;
    amount: number;
    itemId?: number;
}
