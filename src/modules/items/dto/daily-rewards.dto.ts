import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DailyRewardType } from '@prisma/client';

export class SetDailyRewardDto {
  date: Date;

  @IsEnum(DailyRewardType)
  type: DailyRewardType;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsInt()
  itemId?: number;

  @IsOptional()
  @IsInt()
  alienPartId?: number;

  @IsOptional()
  @IsInt()
  gearItemId?: number;
}
