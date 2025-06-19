import { PrismaClient, DailyRewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Seeding daily rewards...');
    // Clear existing data first
    await prisma.dailyReward.deleteMany({});

    // Create daily rewards for a week (plus a few extras)
    const dailyRewards = [
      // Days 1-6: Initial progression
      {
        type: DailyRewardType.STARS,
        amount: 2,
        rewardDate: new Date(Date.now() + 86400000 * 0), // Today
      },
      {
        type: DailyRewardType.STARS,
        amount: 4,
        rewardDate: new Date(Date.now() + 86400000 * 1),
      },
      {
        type: DailyRewardType.STARS,
        amount: 6,
        rewardDate: new Date(Date.now() + 86400000 * 2),
      },
      {
        type: DailyRewardType.STARS,
        amount: 8,
        rewardDate: new Date(Date.now() + 86400000 * 3),
      },
      {
        type: DailyRewardType.STARS,
        amount: 10,
        rewardDate: new Date(Date.now() + 86400000 * 4),
      },
      {
        type: DailyRewardType.STARS,
        amount: 20,
        rewardDate: new Date(Date.now() + 86400000 * 5),
      },
      // Days 6-12: Increase by 4 each day
      {
        type: DailyRewardType.STARS,
        amount: 24,
        rewardDate: new Date(Date.now() + 86400000 * 6),
      },
      {
        type: DailyRewardType.STARS,
        amount: 28,
        rewardDate: new Date(Date.now() + 86400000 * 7),
      },
      {
        type: DailyRewardType.STARS,
        amount: 32,
        rewardDate: new Date(Date.now() + 86400000 * 8),
      },
      {
        type: DailyRewardType.STARS,
        amount: 36,
        rewardDate: new Date(Date.now() + 86400000 * 9),
      },
      {
        type: DailyRewardType.STARS,
        amount: 40,
        rewardDate: new Date(Date.now() + 86400000 * 10),
      },
      {
        type: DailyRewardType.STARS,
        amount: 44,
        rewardDate: new Date(Date.now() + 86400000 * 11),
      },
      // Days 12-24: Increase by 6 each day
      {
        type: DailyRewardType.STARS,
        amount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 12),
      },
      {
        type: DailyRewardType.STARS,
        amount: 56,
        rewardDate: new Date(Date.now() + 86400000 * 13),
      },
      {
        type: DailyRewardType.STARS,
        amount: 62,
        rewardDate: new Date(Date.now() + 86400000 * 14),
      },
      {
        type: DailyRewardType.STARS,
        amount: 68,
        rewardDate: new Date(Date.now() + 86400000 * 15),
      },
      {
        type: DailyRewardType.STARS,
        amount: 74,
        rewardDate: new Date(Date.now() + 86400000 * 16),
      },
      {
        type: DailyRewardType.STARS,
        amount: 80,
        rewardDate: new Date(Date.now() + 86400000 * 17),
      },
      {
        type: DailyRewardType.STARS,
        amount: 86,
        rewardDate: new Date(Date.now() + 86400000 * 18),
      },
      {
        type: DailyRewardType.STARS,
        amount: 92,
        rewardDate: new Date(Date.now() + 86400000 * 19),
      },
      {
        type: DailyRewardType.STARS,
        amount: 98,
        rewardDate: new Date(Date.now() + 86400000 * 20),
      },
      {
        type: DailyRewardType.STARS,
        amount: 104,
        rewardDate: new Date(Date.now() + 86400000 * 21),
      },
      {
        type: DailyRewardType.STARS,
        amount: 110,
        rewardDate: new Date(Date.now() + 86400000 * 22),
      },
      {
        type: DailyRewardType.STARS,
        amount: 116,
        rewardDate: new Date(Date.now() + 86400000 * 23),
      },
      // Days 24-28: Increase by 8 each day
      {
        type: DailyRewardType.STARS,
        amount: 124,
        rewardDate: new Date(Date.now() + 86400000 * 24),
      },
      {
        type: DailyRewardType.STARS,
        amount: 132,
        rewardDate: new Date(Date.now() + 86400000 * 25),
      },
      {
        type: DailyRewardType.STARS,
        amount: 140,
        rewardDate: new Date(Date.now() + 86400000 * 26),
      },
      {
        type: DailyRewardType.STARS,
        amount: 148,
        rewardDate: new Date(Date.now() + 86400000 * 27),
      },
    ];

    // Filter out any rewards with undefined IDs (in case the fetched items were empty)
    const validDailyRewards = dailyRewards.filter((reward) => {
      if (reward.type === DailyRewardType.STARS && !reward.amount) return false;
      return true;
    });

    // Create the daily rewards
    const createdDailyRewards = await prisma.dailyReward.createMany({
      data: validDailyRewards,
      skipDuplicates: true,
    });

    console.log(`Created ${createdDailyRewards.count} daily rewards`);
  } catch (error) {
    console.error('Error in daily rewards seed:', error);
    throw error;
  }
}
