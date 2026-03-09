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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      const quests = await this.prisma.quest.findMany();

      // Process quests and get the appropriate userQuests for each
      const processedQuests = await Promise.all(
        quests.map(async (quest) => {
          let userQuest;

          // For daily quests, get only today's userQuest
          if (quest.frequency === 'daily') {
            userQuest = await this.prisma.userQuest.findFirst({
              where: {
                userId: user.id,
                questId: quest.id,
                createdAt: {
                  gte: todayUTC,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }
          // For weekly quests, get only this week's userQuest
          else if (quest.frequency === 'weekly') {
            userQuest = await this.prisma.userQuest.findFirst({
              where: {
                userId: user.id,
                questId: quest.id,
                createdAt: {
                  gte: currentWeekStartUTC,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }
          // For monthly quests, get only this month's userQuest
          else if (quest.frequency === 'monthly') {
            const currentMonthStartUTC = this.getCurrentMonthStartUTC();
            userQuest = await this.prisma.userQuest.findFirst({
              where: {
                userId: user.id,
                questId: quest.id,
                createdAt: {
                  gte: currentMonthStartUTC,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }
          // For other quest types, get the most recent userQuest
          else {
            userQuest = await this.prisma.userQuest.findFirst({
              where: {
                userId: user.id,
                questId: quest.id,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }

          return {
            id: quest.id,
            type: quest.type,
            frequency: quest.frequency,
            description: quest.description,
            requiredNumber: quest.requiredNumber,
            rewards: quest.rewards,
            isClaimed: userQuest?.isClaimed || false,
            currentProgress: userQuest?.currentProgress || 0,
            isCompleted: userQuest?.isCompleted || false,
          };
        }),
      );

      return {
        success: true,
        quests: processedQuests,
        dailyResetTime: this.getDailyResetTimeUTC().toISOString(),
        weeklyResetTime: this.getWeeklyResetTimeUTC().toISOString(),
        monthlyResetTime: this.getMonthlyResetTimeUTC().toISOString(),
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

      // Get the quest to determine its frequency
      const quest = await this.prisma.quest.findUnique({
        where: { id: Number(questId) },
      });

      if (!quest) {
        throw new BadRequestException('Quest not found');
      }

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Build the query based on quest frequency
      const userQuestQuery: any = {
        userId: user.id,
        questId: Number(questId),
        isCompleted: true,
        isClaimed: false,
      };

      // For daily quests, only consider today's quest
      if (quest.frequency === 'daily') {
        userQuestQuery.createdAt = { gte: todayUTC };
      }
      // For weekly quests, only consider this week's quest
      else if (quest.frequency === 'weekly') {
        userQuestQuery.createdAt = { gte: currentWeekStartUTC };
      }
      // For monthly quests, only consider this month's quest
      else if (quest.frequency === 'monthly') {
        userQuestQuery.createdAt = { gte: this.getCurrentMonthStartUTC() };
      }

      const userQuest = await this.prisma.userQuest.findFirst({
        where: userQuestQuery,
        include: { quest: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!userQuest) {
        throw new BadRequestException(
          'No claimable quest found for the current period',
        );
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
      ]);

      return { success: true, message: 'Rewards claimed successfully' };
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();

      // Check if the user has already completed the login quest today
      // if (user.lastDailyLogin) {
      //   const lastLoginUTC = new Date(user.lastDailyLogin);
      //   const lastLoginDay = new Date(
      //     Date.UTC(
      //       lastLoginUTC.getUTCFullYear(),
      //       lastLoginUTC.getUTCMonth(),
      //       lastLoginUTC.getUTCDate(),
      //       0,
      //       0,
      //       0,
      //       0,
      //     ),
      //   );

      //   if (lastLoginDay.getTime() === todayUTC.getTime()) {
      //     return {
      //       success: false,
      //       message: 'Login quest already completed for today',
      //     };
      //   }
      // }

      // Get all login quests
      const loginQuests = await this.prisma.quest.findMany({
        where: { type: 'login' },
      });

      if (loginQuests.length === 0) {
        throw new BadRequestException('No login quests available');
      }

      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyLoginQuests = loginQuests.filter(
        (q) => q.frequency === 'daily',
      );
      for (const quest of dailyLoginQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyLoginQuests = loginQuests.filter(
        (q) => q.frequency === 'weekly',
      );
      for (const quest of weeklyLoginQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Update the user's last login time
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastDailyLogin: new Date() },
      });

      return {
        success: true,
        message: 'Login quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, message: error.message };
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

      // Get all message quests
      const messageQuests = await this.prisma.quest.findMany({
        where: { type: 'message' },
      });

      if (messageQuests.length === 0) {
        throw new BadRequestException('No message quests available');
      }

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyMessageQuests = messageQuests.filter(
        (q) => q.frequency === 'daily',
      );
      for (const quest of dailyMessageQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyMessageQuests = messageQuests.filter(
        (q) => q.frequency === 'weekly',
      );
      for (const quest of weeklyMessageQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyWheelQuests = wheelQuests.filter(
        (q) => q.frequency === 'daily',
      );
      for (const quest of dailyWheelQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyWheelQuests = wheelQuests.filter(
        (q) => q.frequency === 'weekly',
      );
      for (const quest of weeklyWheelQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeWheelQuests = wheelQuests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeWheelQuests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyRaidQuests = raidQuests.filter((q) => q.frequency === 'daily');
      for (const quest of dailyRaidQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyRaidQuests = raidQuests.filter(
        (q) => q.frequency === 'weekly',
      );
      for (const quest of weeklyRaidQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeRaidQuests = raidQuests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeRaidQuests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Raid quest progress updated successfully',
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyLevelQuests = levelQuests.filter(
        (q) => q.frequency === 'daily',
      );
      for (const quest of dailyLevelQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyLevelQuests = levelQuests.filter(
        (q) => q.frequency === 'weekly',
      );
      for (const quest of weeklyLevelQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeLevelQuests = levelQuests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeLevelQuests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Level quest progress updated successfully',
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyBuyQuests = buyQuests.filter((q) => q.frequency === 'daily');
      for (const quest of dailyBuyQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyBuyQuests = buyQuests.filter((q) => q.frequency === 'weekly');
      for (const quest of weeklyBuyQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeBuyQuests = buyQuests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeBuyQuests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Buy quest progress updated successfully',
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyT3Quests = t3Quests.filter((q) => q.frequency === 'daily');
      for (const quest of dailyT3Quests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyT3Quests = t3Quests.filter((q) => q.frequency === 'weekly');
      for (const quest of weeklyT3Quests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeT3Quests = t3Quests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeT3Quests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
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

      // Get current date info for tracking using UTC
      const todayUTC = this.getTodayUTC();
      const currentWeekStartUTC = this.getCurrentWeekStartUTC();

      // Process daily quests
      const dailyURQuests = urQuests.filter((q) => q.frequency === 'daily');
      for (const quest of dailyURQuests) {
        // Check if user already has this quest for today
        const existingDailyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: todayUTC,
            },
          },
        });

        if (!existingDailyQuest) {
          // Create new daily quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingDailyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingDailyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingDailyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process weekly quests
      const weeklyURQuests = urQuests.filter((q) => q.frequency === 'weekly');
      for (const quest of weeklyURQuests) {
        // Check if user already has this quest for current week
        const existingWeeklyQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: {
              gte: currentWeekStartUTC,
            },
          },
        });

        if (!existingWeeklyQuest) {
          // Create new weekly quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else if (!existingWeeklyQuest.isCompleted) {
          // Update existing quest if not completed
          const newProgress = existingWeeklyQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingWeeklyQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
        // If already completed, do nothing
      }

      // Process one-time quests (if any)
      const oneTimeURQuests = urQuests.filter(
        (q) => q.frequency !== 'daily' && q.frequency !== 'weekly',
      );
      for (const quest of oneTimeURQuests) {
        // Check if user already has this quest
        const existingQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            isCompleted: false,
          },
        });

        if (!existingQuest) {
          // Create new quest progress with initial progress of 1
          await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: 1,
              isCompleted: 1 >= quest.requiredNumber,
            },
          });
        } else {
          // Update existing quest
          const newProgress = existingQuest.currentProgress + 1;
          await this.prisma.userQuest.update({
            where: { id: existingQuest.id },
            data: {
              currentProgress: newProgress,
              isCompleted: newProgress >= quest.requiredNumber,
            },
          });
        }
      }

      return {
        success: true,
        message: 'UR characters quest progress updated successfully',
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  // public async progressT3CharactersQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const t3Quests = await this.prisma.quest.findMany({
  //       where: { type: 'T3Characters' },
  //     });

  //     if (t3Quests.length === 0) {
  //       throw new BadRequestException('No T3 characters quests available');
  //     }

  //     const userT3Quests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: t3Quests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userT3Quests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'T3 characters quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressURCharactersQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const urQuests = await this.prisma.quest.findMany({
  //       where: { type: 'URCharacters' },
  //     });

  //     if (urQuests.length === 0) {
  //       throw new BadRequestException('No UR characters quests available');
  //     }

  //     const userURQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: urQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userURQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'UR characters quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressLevelQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const levelQuests = await this.prisma.quest.findMany({
  //       where: { type: 'level' },
  //     });

  //     if (levelQuests.length === 0) {
  //       throw new BadRequestException('No level quests available');
  //     }

  //     const userLevelQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: levelQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userLevelQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'Level quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressRaidQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const raidQuests = await this.prisma.quest.findMany({
  //       where: { type: 'raid' },
  //     });

  //     if (raidQuests.length === 0) {
  //       throw new BadRequestException('No raid quests available');
  //     }

  //     const userRaidQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: raidQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userRaidQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'Raid quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressWheelQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const wheelQuests = await this.prisma.quest.findMany({
  //       where: { type: 'wheel' },
  //     });

  //     if (wheelQuests.length === 0) {
  //       throw new BadRequestException('No wheel quests available');
  //     }

  //     const userWheelQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: wheelQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userWheelQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'Wheel quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressLoginQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     // Check if the user has already completed the login quest today
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const lastDailyLogin = user.lastDailyLogin;
  //     lastDailyLogin.setHours(0, 0, 0, 0);
  //     if (lastDailyLogin >= today) {
  //       return {
  //         success: false,
  //         message: 'Login quest already completed for today',
  //       };
  //     }

  //     const loginQuests = await this.prisma.quest.findMany({
  //       where: { type: 'login' },
  //     });

  //     if (loginQuests.length === 0) {
  //       throw new BadRequestException('No login quests available');
  //     }

  //     const userLoginQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: loginQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     for (const userQuest of userLoginQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     await this.prisma.user.update({
  //       where: { id: user.id },
  //       data: { lastDailyLogin: today },
  //     });

  //     return {
  //       success: true,
  //       message: 'Login quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async claimRewardsOld(walletAddress: string, questId: number) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const userQuest = await this.prisma.userQuest.findFirst({
  //       where: { userId: user.id, questId: Number(questId) },
  //       include: { quest: true },
  //     });

  //     if (!userQuest || !userQuest.isCompleted) {
  //       throw new BadRequestException('Quest not completed or not found');
  //     }

  //     const rewards = userQuest.quest.rewards as {
  //       stars?: number;
  //       runes?: string[];
  //     };

  //     const updateData: any = {};

  //     if (rewards.stars) {
  //       updateData.stars = { increment: rewards.stars };
  //     }
  //     if (rewards.runes) {
  //       updateData.runes = { push: rewards.runes };
  //     }

  //     await this.prisma.$transaction([
  //       this.prisma.user.update({
  //         where: { id: user.id },
  //         data: updateData,
  //       }),
  //       this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: { isClaimed: true },
  //       }),
  //       // this.prisma.userQuest.delete({ where: { id: userQuest.id } }),
  //     ]);

  //     return { success: true, message: 'Rewards claimed successfully' };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async progressMessageQuestOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const messageQuests = await this.prisma.quest.findMany({
  //       where: { type: 'message' },
  //     });

  //     if (messageQuests.length === 0) {
  //       throw new BadRequestException('No message quests available');
  //     }

  //     let userMessageQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: messageQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     if (userMessageQuests.length === 0) {
  //       const missingQuestIds = messageQuests.map((quest) => quest.id);

  //       await this.prisma.userQuest.createMany({
  //         data: missingQuestIds.map((questId) => ({
  //           userId: user.id,
  //           questId,
  //         })),
  //         skipDuplicates: true,
  //       });
  //     }

  //     userMessageQuests = await this.prisma.userQuest.findMany({
  //       where: {
  //         userId: user.id,
  //         questId: { in: messageQuests.map((q) => q.id) },
  //         isCompleted: false,
  //       },
  //       include: { quest: true },
  //     });

  //     console.log('userMessageQuests', userMessageQuests);

  //     for (const userQuest of userMessageQuests) {
  //       await this.prisma.userQuest.update({
  //         where: { id: userQuest.id },
  //         data: {
  //           currentProgress: {
  //             increment: 1,
  //           },
  //           isCompleted:
  //             userQuest.currentProgress + 1 >= userQuest.quest.requiredNumber,
  //         },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: 'Message quest progress updated successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async listQuestsOld(walletAddress: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { walletAddress },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     const quests = await this.prisma.quest.findMany({
  //       include: {
  //         userQuests: {
  //           where: { userId: user.id },
  //         },
  //       },
  //     });

  //     return {
  //       success: true,
  //       quests: quests.map((quest) => ({
  //         id: quest.id,
  //         type: quest.type,
  //         frequency: quest.frequency,
  //         description: quest.description,
  //         requiredNumber: quest.requiredNumber,
  //         rewards: quest.rewards,
  //         isClaimed: quest.userQuests[0]?.isClaimed || false,
  //         currentProgress: quest.userQuests[0]?.currentProgress || 0,
  //         isCompleted: quest.userQuests[0]?.isCompleted || false,
  //       })),
  //       dailyResetTime: this.getDailyResetTimeUTC().toISOString(),
  //       weeklyResetTime: this.getWeeklyResetTimeUTC().toISOString(),
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async assignDailyAndWeeklyQuests() {
  //   try {
  //     const users = await this.prisma.user.findMany();

  //     for (const user of users) {
  //       // Assign daily quests
  //       const dailyQuests = await this.prisma.quest.findMany({
  //         where: { frequency: 'daily' },
  //       });

  //       for (const quest of dailyQuests) {
  //         const existingUserQuest = await this.prisma.userQuest.findFirst({
  //           where: { userId: user.id, questId: quest.id },
  //         });

  //         if (!existingUserQuest) {
  //           await this.prisma.userQuest.create({
  //             data: {
  //               userId: user.id,
  //               questId: quest.id,
  //             },
  //           });
  //         }
  //       }

  //       // Assign weekly quests
  //       const weeklyQuests = await this.prisma.quest.findMany({
  //         where: { frequency: 'weekly' },
  //       });

  //       for (const quest of weeklyQuests) {
  //         const existingUserQuest = await this.prisma.userQuest.findFirst({
  //           where: { userId: user.id, questId: quest.id },
  //         });

  //         if (!existingUserQuest) {
  //           await this.prisma.userQuest.create({
  //             data: {
  //               userId: user.id,
  //               questId: quest.id,
  //             },
  //           });
  //         }
  //       }
  //     }

  //     return {
  //       success: true,
  //       message: 'Daily and weekly quests assigned successfully',
  //     };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async resetDailyQuests() {
  //   try {
  //     const dailyQuests = await this.prisma.quest.findMany({
  //       where: { frequency: 'daily' },
  //     });

  //     for (const quest of dailyQuests) {
  //       await this.prisma.userQuest.updateMany({
  //         where: { questId: quest.id, isCompleted: true },
  //         data: { currentProgress: 0, isCompleted: false, isClaimed: false },
  //       });
  //     }

  //     return { success: true, message: 'Daily quests reset successfully' };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // public async resetWeeklyQuests() {
  //   try {
  //     const weeklyQuests = await this.prisma.quest.findMany({
  //       where: { frequency: 'weekly' },
  //     });

  //     for (const quest of weeklyQuests) {
  //       await this.prisma.userQuest.updateMany({
  //         where: { questId: quest.id, isCompleted: true },
  //         data: { currentProgress: 0, isCompleted: false, isClaimed: false },
  //       });
  //     }

  //     return { success: true, message: 'Weekly quests reset successfully' };
  //   } catch (error) {
  //     return { success: false, error };
  //   }
  // }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async handleDailyQuestReset() {
  //   try {
  //     await this.resetDailyQuests();
  //     await this.assignDailyAndWeeklyQuests();
  //   } catch (error) {
  //     console.error('Error during daily quest reset:', error);
  //   }
  // }

  // @Cron('0 0 * * 1') // Every Monday at midnight
  // async handleWeeklyQuestReset() {
  //   try {
  //     await this.resetWeeklyQuests();
  //     await this.assignDailyAndWeeklyQuests();
  //   } catch (error) {
  //     console.error('Error during weekly quest reset:', error);
  //   }
  // }

  /**
   * Gets the current UTC date with time set to 00:00:00
   */
  private getTodayUTC(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  /**
   * Gets the start of the current week (Monday) in UTC
   */
  private getCurrentWeekStartUTC(): Date {
    const today = this.getTodayUTC();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday

    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - diff);

    return weekStart;
  }

  /**
   * Gets the next day's reset time in UTC
   */
  private getDailyResetTimeUTC(): Date {
    const tomorrow = this.getTodayUTC();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  }

  /**
   * Gets the next week's reset time (next Monday) in UTC
   */
  private getWeeklyResetTimeUTC(): Date {
    const today = this.getTodayUTC();
    const dayOfWeek = today.getUTCDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(today);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilNextMonday);
    return nextMonday;
  }

  /**
   * Gets the start of the current month in UTC
   */
  private getCurrentMonthStartUTC(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
        0,
        0,
        0,
        0,
      ),
    );
  }

  /**
   * Gets the start of the next month in UTC
   */
  private getMonthlyResetTimeUTC(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCMonth() === 11
          ? now.getUTCFullYear() + 1
          : now.getUTCFullYear(),
        (now.getUTCMonth() + 1) % 12,
        1,
        0,
        0,
        0,
        0,
      ),
    );
  }

  /**
   * Progress volume-based quests based on the user's total ZONE trading volume
   * for the current month. Called after each buy/sell transaction.
   * 
   * Volume quest tiers:
   * 10,000 ZONE = 100 Stars
   * 20,000 ZONE = 200 Stars
   * 30,000 ZONE = 300 Stars
   * 40,000 ZONE = 400 Stars
   * 50,000 ZONE = 500 Stars
   * 60,000 ZONE = 600 Stars
   * 70,000 ZONE = 700 Stars
   * 80,000 ZONE = 800 Stars
   * 90,000 ZONE = 900 Stars
   * 100,000 ZONE = 2,000 Stars
   */
  public async progressVolumeQuest(walletAddress: string, zoneVolume: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const currentMonthStartUTC = this.getCurrentMonthStartUTC();

      // Get all volume quests
      const volumeQuests = await this.prisma.quest.findMany({
        where: { type: 'volume' },
        orderBy: { requiredNumber: 'asc' },
      });

      if (volumeQuests.length === 0) {
        return { success: true, message: 'No volume quests found' };
      }

      const results = [];

      for (const quest of volumeQuests) {
        // Check for existing monthly userQuest
        let userQuest = await this.prisma.userQuest.findFirst({
          where: {
            userId: user.id,
            questId: quest.id,
            createdAt: { gte: currentMonthStartUTC },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!userQuest) {
          // Create new monthly user quest
          userQuest = await this.prisma.userQuest.create({
            data: {
              userId: user.id,
              questId: quest.id,
              currentProgress: Math.floor(zoneVolume),
              isCompleted: zoneVolume >= quest.requiredNumber,
            },
          });
        } else if (!userQuest.isClaimed) {
          // Update progress
          userQuest = await this.prisma.userQuest.update({
            where: { id: userQuest.id },
            data: {
              currentProgress: Math.floor(zoneVolume),
              isCompleted: zoneVolume >= quest.requiredNumber,
            },
          });
        }

        results.push({
          questId: quest.id,
          progress: Math.floor(zoneVolume),
          required: quest.requiredNumber,
          isCompleted: userQuest.isCompleted,
          isClaimed: userQuest.isClaimed,
        });
      }

      return { success: true, quests: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
