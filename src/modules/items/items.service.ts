import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
import { DailyRewardType, ItemQuality, ItemType } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  public async createItem(
    type: ItemType,
    quality: ItemQuality,
    description: string,
    image: string,
  ) {
    await this.prisma.item.create({
      data: {
        type,
        quality,
        description,
        image,
      },
    });
  }

  public async editItem(
    id: number,
    type: ItemType,
    quality: ItemQuality,
    description?: string,
    image?: string,
  ) {
    await this.prisma.item.update({
      where: {
        id: id,
      },
      data: {
        ...(type && { type }),
        ...(quality && { quality }),
        ...(description && { description }),
        ...(image && { image }),
      },
    });
  }

  public async deleteItem(id: number) {
    await this.prisma.item.delete({
      where: {
        id: id,
      },
    });
  }

  public async getAllItems(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return await this.prisma.item.findMany({
      skip: skip,
      take: limit,
    });
  }

  public async setDailyRewards(rewards: SetDailyRewardDto[]) {
    for (const reward of rewards) {
      const dailyReward = await this.prisma.dailyReward.findFirst({
        where: {
          rewardDate: reward.date,
        },
      });

      await this.prisma.dailyReward.upsert({
        where: {
          id: dailyReward.id,
        },
        update: {
          type: reward.type,
          itemId: reward.type === DailyRewardType.ITEM ? reward.itemId : null,
          amount: reward.amount,
          alienPartId:
            reward.type === DailyRewardType.PARTS ? reward.alienPartId : null,
          gearItemId:
            reward.type === DailyRewardType.GEAR ? reward.gearItemId : null,
        },
        create: {
          type: reward.type,
          item: {
            connect: { id: reward.itemId },
          },
          amount: reward.amount,
          rewardDate: reward.date,
          alienPart: {
            connect: { id: reward.alienPartId },
          },
          gearItem: {
            connect: { id: reward.gearItemId },
          },
        },
      });
    }
  }

  public async getDailyRewards() {
    return await this.prisma.dailyReward.findMany();
  }
}
