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

  public async rewardItem(walletAddress: string, itemId: number) {
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

  public async rewardAlienPart(walletAddress: string, alienPartId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
      include: {
        AlienPartGroups: true,
      },
    });

    const alienPart = await this.prisma.alienPart.findFirst({
      where: {
        id: alienPartId,
      },
    });

    const userAlienPartGroup = await this.prisma.alienPartGroup.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        parts: true,
      },
    });

    await this.prisma.alienPartGroup.update({
      where: {
        id: userAlienPartGroup.id,
      },
      data: {
        parts: {
          set: [...userAlienPartGroup.parts, alienPart],
        },
      },
    });
  }

  public async rewardGearItem(walletAddress: string, gearItemId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    const userGearItem = await this.prisma.userGearItem.findFirst({
      where: {
        userId: user.id,
        gearItemId: gearItemId,
      },
    });

    await this.prisma.userGearItem.upsert({
      where: {
        id: userGearItem?.id,
      },
      update: {
        quantity: userGearItem?.quantity + 1,
      },
      create: {
        user: {
          connect: { id: user.id },
        },
        gearItem: {
          connect: { id: gearItemId },
        },
        quantity: 1,
      },
    });
  }

  public async rewardStars(walletAddress: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stars: {
          increment: amount,
        },
      },
    });
  }

  public async rewardXp(walletAddress: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        experience: {
          increment: amount,
        },
      },
    });
  }

  public async claimDailyReward(walletAddress: string) {
    try {
      var user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyReward = await this.prisma.dailyReward.findFirst({
        where: {
          rewardDate: today,
        },
      });

      if (!dailyReward) {
        throw new Error('No daily reward available');
      }

      if (user.lastDailyClaimed) {
        const lastClaimed = new Date(user.lastDailyClaimed);
        lastClaimed.setHours(0, 0, 0, 0);

        if (lastClaimed.getTime() === today.getTime()) {
          throw new Error('Daily reward already claimed');
        }

        const timeDifference = today.getTime() - lastClaimed.getTime();
        if (
          timeDifference > 24 * 60 * 60 * 1000 &&
          timeDifference <= 48 * 60 * 60 * 1000
        ) {
          user = await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              dailyStreak: {
                increment: 1,
              },
            },
          });
        } else if (timeDifference > 48 * 60 * 60 * 1000) {
          user = await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              dailyStreak: 0,
            },
          });
        }
      }

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          dailyStreak: {
            increment: 1,
          },
        },
      });

      switch (dailyReward.type) {
        case DailyRewardType.STARS:
          await this.rewardStars(
            walletAddress,
            dailyReward.amount * user.dailyStreak,
          );
          break;
        case DailyRewardType.XP:
          await this.rewardXp(
            walletAddress,
            dailyReward.amount * user.dailyStreak,
          );
          break;
        case DailyRewardType.ITEM:
          await this.rewardItem(walletAddress, dailyReward.itemId);
          break;
        case DailyRewardType.PARTS:
          await this.rewardAlienPart(walletAddress, dailyReward.alienPartId);
          break;
        case DailyRewardType.GEAR:
          await this.rewardGearItem(walletAddress, dailyReward.gearItemId);
          break;
      }

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastDailyClaimed: new Date(),
        },
      });

      return {
        message: 'Reward claimed',
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
