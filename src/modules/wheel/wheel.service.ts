import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestService } from '../quest/quest.service';
import { ItemType, ItemQuality, RuneType } from '@prisma/client';

@Injectable()
export class WheelService {
  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
  ) {}

  public async spinWheel(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const today = new Date();
      today.setUTCHours(1, 0, 0, 0);

      const lastSpin = await this.prisma.userSpin.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (lastSpin && lastSpin.createdAt >= today) {
        throw new BadRequestException('You have already spun the wheel today');
      }

      // Logic for spinning the wheel and determining the result
      const result = this.getWheelResult();

      // Update user rewards based on the result
      await this.updateUserRewards(user.id, result);

      // Record the spin
      await this.prisma.userSpin.create({
        data: {
          userId: user.id,
          result,
        },
      });

      try {
        await this.questService.progressWheelQuest(walletAddress);
      } catch (error) {
        console.error('Error progressing wheel quest:', error);
      }

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  public async canSpin(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const today = new Date();
      today.setUTCHours(1, 0, 0, 0);

      const lastSpin = await this.prisma.userSpin.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      const canSpin = !lastSpin || lastSpin.createdAt < today;
      return { success: true, canSpin };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  public async getSpinHistory(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const spins = await this.prisma.userSpin.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      const spinTimes = spins.map((spin) => {
        const spinTime = new Date(spin.createdAt);
        spinTime.setUTCHours(1, 0, 0, 0);
        return spinTime;
      });

      return { success: true, spinTimes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private getWheelResult() {
    const random = Math.random() * 100;

    if (random < 20)
      return {
        type: 'stars',
        amount: 20,
        message: 'You won 20 stars!',
      };
    if (random < 50)
      return {
        type: 'item',
        itemType: ItemType.CUT,
        itemQuality: ItemQuality.BRONZE,
        message: 'You won a bronze cut!',
      };
    if (random < 65)
      return {
        type: 'item',
        itemType: ItemType.KNIFE,
        itemQuality: ItemQuality.SILVER,
        message: 'You won a silver knife!',
      };
    if (random < 77)
      return {
        type: 'item',
        itemType: ItemType.SHEARS,
        itemQuality: ItemQuality.GOLDEN,
        message: 'You won a golden shears!',
      };
    if (random < 87)
      return {
        type: 'rune',
        itemType: RuneType.UNCOMMON,
        message: 'You won an uncommon rune!',
      };
    if (random < 94)
      return {
        type: 'rune',
        itemType: RuneType.COMMON,
        message: 'You won a common rune!',
      };
    if (random < 97)
      return {
        type: 'rune',
        itemType: RuneType.RARE,
        message: 'You won a rare rune!',
      };
    if (random < 99)
      return {
        type: 'rune',
        itemType: RuneType.EPIC,
        message: 'You won an epic rune!',
      };
    return {
      type: 'rune',
      itemType: RuneType.LEGENDARY,
      message: 'You won a legendary rune!',
    };
  }

  private async updateUserRewards(userId: number, result: any) {
    try {
      switch (result.type) {
        case 'stars':
          await this.prisma.user.update({
            where: { id: userId },
            data: { stars: { increment: result.amount } },
          });
          break;
        case 'item':
          const item = await this.prisma.item.findFirst({
            where: {
              type: result.itemType,
              quality: result.itemQuality,
            },
          });

          if (item) {
            const userItem = await this.prisma.userItem.findFirst({
              where: {
                userId,
                itemId: item.id,
              },
            });

            if (userItem) {
              await this.prisma.userItem.update({
                where: { id: userItem.id },
                data: { quantity: { increment: 1 } },
              });
            } else {
              await this.prisma.userItem.create({
                data: {
                  userId,
                  itemId: item.id,
                  quantity: 1,
                },
              });
            }
          }
          break;
        case 'rune':
          await this.prisma.user.update({
            where: { id: userId },
            data: { runes: { push: result.runeType } },
          });
          break;
      }
    } catch (error) {
      throw new BadRequestException('Error updating user rewards');
    }
  }

  public getRewards() {
    return [
      { name: 'Stars', amount: 20 },
      { name: 'Bronze Cut', amount: 1 },
      { name: 'Silver Knife', amount: 1 },
      { name: 'Golden Shears', amount: 1 },
      { name: 'Uncommon Rune', amount: 1 },
      { name: 'Common Rune', amount: 1 },
      { name: 'Rare Rune', amount: 1 },
      { name: 'Epic Rune', amount: 1 },
      { name: 'Legendary Rune', amount: 1 },
    ];
  }
}
