import { PrismaClient, DailyRewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Seeding daily rewards...');
    // Clear existing data first
    await prisma.dailyReward.deleteMany({});

    // Create daily rewards for a week (plus a few extras)
    const dailyRewards = [
      // Day 1: Stars reward
      {
        type: DailyRewardType.STARS,
        amount: 100,
        rewardDate: new Date(Date.now() + 86400000 * 0), // Today
      },

      // Day 2: XP reward
      {
        type: DailyRewardType.STARS,
        amount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 1), // Tomorrow
      },

      // Day 3: Item reward
      {
        type: DailyRewardType.STARS,
        amount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 2),
      },

      // Day 4: Parts reward
      {
        type: DailyRewardType.STARS,
        amount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 3),
      },

      // Day 5: Gear reward
      {
        type: DailyRewardType.STARS,
        amount: 50,
        rewardDate: new Date(Date.now() + 86400000 * 4),
      },

      // Day 6: Stars reward (bigger)
      {
        type: DailyRewardType.STARS,
        amount: 200,
        rewardDate: new Date(Date.now() + 86400000 * 5),
      },

      // Day 7: XP reward (bigger)
      {
        type: DailyRewardType.STARS,
        amount: 200,
        rewardDate: new Date(Date.now() + 86400000 * 6),
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
