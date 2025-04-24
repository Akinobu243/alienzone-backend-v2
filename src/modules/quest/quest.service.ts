import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestService {
  constructor(private prisma: PrismaService) {}

  public async listQuests(walletAddress: string) {
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
          isClaimed: quest.userQuests[0]?.isClaimed || false,
          currentProgress: quest.userQuests[0]?.currentProgress || 0,
          isCompleted: quest.userQuests[0]?.isCompleted || false,
        })),
        dailyResetTime: new Date(
          new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000,
        ).toISOString(),
        weeklyResetTime: (() => {
          const now = new Date();
          const dayOfWeek = now.getDay();
          const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
          const nextMonday = new Date(
            now.setHours(0, 0, 0, 0) +
              daysUntilNextMonday * 24 * 60 * 60 * 1000,
          );
          return nextMonday.toISOString();
        })(),
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async claimRewards(walletAddress: string, questId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userQuest = await this.prisma.userQuest.findFirst({
        where: { userId: user.id, questId: Number(questId) },
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
        this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: { isClaimed: true },
        }),
        // this.prisma.userQuest.delete({ where: { id: userQuest.id } }),
      ]);

      return { success: true, message: 'Rewards claimed successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async assignDailyAndWeeklyQuests() {
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

  public async resetDailyQuests() {
    try {
      const dailyQuests = await this.prisma.quest.findMany({
        where: { frequency: 'daily' },
      });

      for (const quest of dailyQuests) {
        await this.prisma.userQuest.updateMany({
          where: { questId: quest.id, isCompleted: true },
          data: { currentProgress: 0, isCompleted: false, isClaimed: false },
        });
      }

      return { success: true, message: 'Daily quests reset successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async resetWeeklyQuests() {
    try {
      const weeklyQuests = await this.prisma.quest.findMany({
        where: { frequency: 'weekly' },
      });

      for (const quest of weeklyQuests) {
        await this.prisma.userQuest.updateMany({
          where: { questId: quest.id, isCompleted: true },
          data: { currentProgress: 0, isCompleted: false, isClaimed: false },
        });
      }

      return { success: true, message: 'Weekly quests reset successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressLoginQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if the user has already completed the login quest today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastDailyLogin = user.lastDailyLogin;
      lastDailyLogin.setHours(0, 0, 0, 0);
      if (lastDailyLogin >= today) {
        return {
          success: false,
          message: 'Login quest already completed for today',
        };
      }

      const loginQuests = await this.prisma.quest.findMany({
        where: { type: 'login' },
      });

      if (loginQuests.length === 0) {
        throw new BadRequestException('No login quests available');
      }

      const userLoginQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: loginQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userLoginQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastDailyLogin: today },
      });

      return {
        success: true,
        message: 'Login quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressMessageQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const messageQuests = await this.prisma.quest.findMany({
        where: { type: 'message' },
      });

      if (messageQuests.length === 0) {
        throw new BadRequestException('No message quests available');
      }

      const userMessageQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: messageQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userMessageQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'Message quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressWheelQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const wheelQuests = await this.prisma.quest.findMany({
        where: { type: 'wheel' },
      });

      if (wheelQuests.length === 0) {
        throw new BadRequestException('No wheel quests available');
      }

      const userWheelQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: wheelQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userWheelQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'Wheel quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressRaidQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const raidQuests = await this.prisma.quest.findMany({
        where: { type: 'raid' },
      });

      if (raidQuests.length === 0) {
        throw new BadRequestException('No raid quests available');
      }

      const userRaidQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: raidQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userRaidQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'Raid quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  // TODO: implement this function
  public async progressBuyQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const buyQuests = await this.prisma.quest.findMany({
        where: { type: 'buy' },
      });

      if (buyQuests.length === 0) {
        throw new BadRequestException('No buy quests available');
      }

      const userBuyQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: buyQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userBuyQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'Buy quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressLevelQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const levelQuests = await this.prisma.quest.findMany({
        where: { type: 'level' },
      });

      if (levelQuests.length === 0) {
        throw new BadRequestException('No level quests available');
      }

      const userLevelQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: levelQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userLevelQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'Level quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressT3CharactersQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const t3Quests = await this.prisma.quest.findMany({
        where: { type: 'T3Characters' },
      });

      if (t3Quests.length === 0) {
        throw new BadRequestException('No T3 characters quests available');
      }

      const userT3Quests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: t3Quests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userT3Quests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'T3 characters quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async progressURCharactersQuest(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const urQuests = await this.prisma.quest.findMany({
        where: { type: 'URCharacters' },
      });

      if (urQuests.length === 0) {
        throw new BadRequestException('No UR characters quests available');
      }

      const userURQuests = await this.prisma.userQuest.findMany({
        where: {
          userId: user.id,
          questId: { in: urQuests.map((q) => q.id) },
          isCompleted: false,
        },
        include: { quest: true },
      });

      for (const userQuest of userURQuests) {
        await this.prisma.userQuest.update({
          where: { id: userQuest.id },
          data: {
            currentProgress: {
              increment: 1,
            },
            isCompleted:
              userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
          },
        });
      }

      return {
        success: true,
        message: 'UR characters quest progress updated successfully',
      };
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

  @Cron('0 0 * * 1') // Every Monday at midnight
  async handleWeeklyQuestReset() {
    try {
      await this.resetWeeklyQuests();
      await this.assignDailyAndWeeklyQuests();
    } catch (error) {
      console.error('Error during weekly quest reset:', error);
    }
  }
}
