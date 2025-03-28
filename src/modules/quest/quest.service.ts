import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestService {
  constructor(private prisma: PrismaService) {}

  async listQuests(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const quests = await this.prisma.quest.findMany({
        include: {
          userQuests: {
            where: { userId: user.id },
          },
        },
      });

      return {
        success: true,
        quests: quests.map((quest) => ({
          id: quest.id,
          type: quest.type,
          frequency: quest.frequency,
          description: quest.description,
          requiredNumber: quest.requiredNumber,
          rewards: quest.rewards,
          currentProgress: quest.userQuests[0]?.currentProgress || 0,
          isCompleted: quest.userQuests[0]?.isCompleted || false,
        })),
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  async claimRewards(walletAddress: string, questId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userQuest = await this.prisma.userQuest.findFirst({
        where: { userId: user.id, questId },
        include: { quest: true },
      });

      if (!userQuest || !userQuest.isCompleted) {
        throw new BadRequestException('Quest not completed or not found');
      }

      const rewards = userQuest.quest.rewards as {
        stars?: number;
        runes?: string[];
      };

      const updateData: any = {};
      if (rewards.stars) {
        updateData.stars = { increment: rewards.stars };
      }
      if (rewards.runes) {
        updateData.runes = { push: rewards.runes };
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        }),
        this.prisma.userQuest.delete({ where: { id: userQuest.id } }),
      ]);

      return { success: true, message: 'Rewards claimed successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  async assignDailyAndWeeklyQuests() {
    try {
      const users = await this.prisma.user.findMany();

      for (const user of users) {
        // Assign daily quests
        const dailyQuests = await this.prisma.quest.findMany({
          where: { frequency: 'daily' },
        });

        for (const quest of dailyQuests) {
          const existingUserQuest = await this.prisma.userQuest.findFirst({
            where: { userId: user.id, questId: quest.id },
          });

          if (!existingUserQuest) {
            await this.prisma.userQuest.create({
              data: {
                userId: user.id,
                questId: quest.id,
              },
            });
          }
        }

        // Assign weekly quests
        const weeklyQuests = await this.prisma.quest.findMany({
          where: { frequency: 'weekly' },
        });

        for (const quest of weeklyQuests) {
          const existingUserQuest = await this.prisma.userQuest.findFirst({
            where: { userId: user.id, questId: quest.id },
          });

          if (!existingUserQuest) {
            await this.prisma.userQuest.create({
              data: {
                userId: user.id,
                questId: quest.id,
              },
            });
          }
        }
      }

      return {
        success: true,
        message: 'Daily and weekly quests assigned successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  async resetDailyQuests() {
    try {
      const dailyQuests = await this.prisma.quest.findMany({
        where: { frequency: 'daily' },
      });

      for (const quest of dailyQuests) {
        await this.prisma.userQuest.updateMany({
          where: { questId: quest.id, isCompleted: true },
          data: { currentProgress: 0, isCompleted: false },
        });
      }

      return { success: true, message: 'Daily quests reset successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  async resetWeeklyQuests() {
    try {
      const weeklyQuests = await this.prisma.quest.findMany({
        where: { frequency: 'weekly' },
      });

      for (const quest of weeklyQuests) {
        await this.prisma.userQuest.updateMany({
          where: { questId: quest.id, isCompleted: true },
          data: { currentProgress: 0, isCompleted: false },
        });
      }

      return { success: true, message: 'Weekly quests reset successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyQuestReset() {
    try {
      await this.resetDailyQuests();
      await this.assignDailyAndWeeklyQuests();
    } catch (error) {
      console.error('Error during daily quest reset:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyQuestReset() {
    try {
      await this.resetWeeklyQuests();
      await this.assignDailyAndWeeklyQuests();
    } catch (error) {
      console.error('Error during weekly quest reset:', error);
    }
  }
}
