import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DailyRewardType } from '@prisma/client';

export class SetDailyRewardDto {
  @IsInt()
  day: number;

  @IsEnum(DailyRewardType)
  type: DailyRewardType;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsInt()
  itemId?: number;
}