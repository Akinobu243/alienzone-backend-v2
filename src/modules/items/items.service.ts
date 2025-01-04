import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
import { DailyRewardType } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  public async createItem(
    name: string,
    description: string,
    image: string
  ) {
    await this.prisma.item.create({
      data: {
        name,
        description,
        image,
      },
    });
  }

  public async editItem(
    id: number,
    name?: string,
    description?: string,
    image?: string,
  ) {
    await this.prisma.item.update({
      where: {
        id: id,
      },
      data: {
        ...(name && { name }),
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
      await this.prisma.dailyReward.upsert({
        where: {
          id: reward.day,
        },
        update: {
          type: reward.type,
          itemId: reward.type === DailyRewardType.ITEM ? reward.itemId : null,
          amount: reward.amount,
        },
        create: {
          type: reward.type,
          item: {
            connect: { id: reward.itemId },
          },
          amount: reward.amount,
        },
      });
    }
  }

  public async rewardItem(
    walletAddress: string,
    itemId: number
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    const userItem = await this.prisma.userItem.findFirst({
      where: {
        userId: user.id,
        itemId: itemId,
      },
    });

    await this.prisma.userItem.upsert({
      where: {
        id: userItem?.id,
      },
      update: {
        quantity: userItem?.quantity + 1,
      },
      create: {
        user: {
          connect: { id: user.id },
        },
        item: {
          connect: { id: itemId },
        },
        quantity: 1,
      },
    });

  }
}