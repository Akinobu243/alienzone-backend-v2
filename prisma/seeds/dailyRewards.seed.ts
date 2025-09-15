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
        totalAmount: 2,
        rewardDate: new Date(Date.now() + 86400000 * 0), // Today
      },
      {
        type: DailyRewardType.STARS,
        amount: 4,
        totalAmount: 8,
        rewardDate: new Date(Date.now() + 86400000 * 1),
      },
      {
        type: DailyRewardType.STARS,
        amount: 6,
        totalAmount: 18,
        rewardDate: new Date(Date.now() + 86400000 * 2),
      },
      {
        type: DailyRewardType.STARS,
        amount: 8,
        totalAmount: 32,
        rewardDate: new Date(Date.now() + 86400000 * 3),
      },
      {
        type: DailyRewardType.STARS,
        amount: 10,
        totalAmount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 4),
      },
      {
        type: DailyRewardType.STARS,
        amount: 20,
        totalAmount: 120,
        rewardDate: new Date(Date.now() + 86400000 * 5),
      },
      // Days 6-12: Increase by 4 each day
      {
        type: DailyRewardType.STARS,
        amount: 24,
        totalAmount: 168,
        rewardDate: new Date(Date.now() + 86400000 * 6),
      },
      {
        type: DailyRewardType.STARS,
        amount: 28,
        totalAmount: 224,
        rewardDate: new Date(Date.now() + 86400000 * 7),
      },
      {
        type: DailyRewardType.STARS,
        amount: 32,
        totalAmount: 288,
        rewardDate: new Date(Date.now() + 86400000 * 8),
      },
      {
        type: DailyRewardType.STARS,
        amount: 36,
        totalAmount: 360,
        rewardDate: new Date(Date.now() + 86400000 * 9),
      },
      {
        type: DailyRewardType.STARS,
        amount: 40,
        totalAmount: 440,
        rewardDate: new Date(Date.now() + 86400000 * 10),
      },
      {
        type: DailyRewardType.STARS,
        amount: 44,
        totalAmount: 528,
        rewardDate: new Date(Date.now() + 86400000 * 11),
      },
      // Days 12-24: Increase by 6 each day
      {
        type: DailyRewardType.STARS,
        amount: 50,
        totalAmount: 650,
        rewardDate: new Date(Date.now() + 86400000 * 12),
      },
      {
        type: DailyRewardType.STARS,
        amount: 56,
        totalAmount: 784,
        rewardDate: new Date(Date.now() + 86400000 * 13),
      },
      {
        type: DailyRewardType.STARS,
        amount: 62,
        totalAmount: 930,
        rewardDate: new Date(Date.now() + 86400000 * 14),
      },
      {
        type: DailyRewardType.STARS,
        amount: 68,
        totalAmount: 1088,
        rewardDate: new Date(Date.now() + 86400000 * 15),
      },
      {
        type: DailyRewardType.STARS,
        amount: 74,
        totalAmount: 1258,
        rewardDate: new Date(Date.now() + 86400000 * 16),
      },
      {
        type: DailyRewardType.STARS,
        amount: 80,
        totalAmount: 1440,
        rewardDate: new Date(Date.now() + 86400000 * 17),
      },
      {
        type: DailyRewardType.STARS,
        amount: 86,
        totalAmount: 1634,
        rewardDate: new Date(Date.now() + 86400000 * 18),
      },
      {
        type: DailyRewardType.STARS,
        amount: 92,
        totalAmount: 1840,
        rewardDate: new Date(Date.now() + 86400000 * 19),
      },
      {
        type: DailyRewardType.STARS,
        amount: 98,
        totalAmount: 2058,
        rewardDate: new Date(Date.now() + 86400000 * 20),
      },
      {
        type: DailyRewardType.STARS,
        amount: 104,
        totalAmount: 2288,
        rewardDate: new Date(Date.now() + 86400000 * 21),
      },
      {
        type: DailyRewardType.STARS,
        amount: 110,
        totalAmount: 2530,
        rewardDate: new Date(Date.now() + 86400000 * 22),
      },
      {
        type: DailyRewardType.STARS,
        amount: 116,
        totalAmount: 2784,
        rewardDate: new Date(Date.now() + 86400000 * 23),
      },
      // Days 24-28: Increase by 8 each day
      {
        type: DailyRewardType.STARS,
        amount: 124,
        totalAmount: 3100,
        rewardDate: new Date(Date.now() + 86400000 * 24),
      },
      {
        type: DailyRewardType.STARS,
        amount: 132,
        totalAmount: 3432,
        rewardDate: new Date(Date.now() + 86400000 * 25),
      },
      {
        type: DailyRewardType.STARS,
        amount: 140,
        totalAmount: 3780,
        rewardDate: new Date(Date.now() + 86400000 * 26),
      },
      {
        type: DailyRewardType.STARS,
        amount: 148,
        totalAmount: 4144,
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
