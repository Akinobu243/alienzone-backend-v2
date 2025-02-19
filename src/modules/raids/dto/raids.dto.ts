import { ApiProperty } from '@nestjs/swagger';
import { RewardType } from '@prisma/client';
import { IsNumber, IsString } from 'class-validator';

export class RaidReward {
  @ApiProperty()
  @IsString()
  type: RewardType;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

export class CreateRaidDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  rewards: RaidReward[];

  @ApiProperty()
  @IsNumber()
  elementId: number;
}

export class EditRaidDTO {
  @ApiProperty()
  @IsNumber()
  raidId: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  rewards: RaidReward[];
}

export class LaunchRaidDTO {
  @ApiProperty()
  @IsNumber()
  raidId: number;

  @ApiProperty()
  alienIds: number[];

  @ApiProperty()
  characterIds: number[];
}
