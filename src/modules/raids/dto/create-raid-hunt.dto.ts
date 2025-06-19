import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RewardType } from '@prisma/client';

class CreateRaidRewardDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: RewardType })
  @IsString()
  type: RewardType;
}

export class CreateRaidHuntDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsNumber()
  elementId: number;

  @ApiProperty()
  @IsBoolean()
  isHunt: boolean;

  @ApiProperty({ type: [CreateRaidRewardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRaidRewardDto)
  rewards: CreateRaidRewardDto[];
}
