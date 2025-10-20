import { PrismaClient, DailyRewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Seeding daily rewards...');
    // Clear existing data first
    await prisma.dailyReward.deleteMany({});

    // Daily rewards: Start with 2 stars, +2 more each day, capped at 56 stars/day
    const dailyRewards = [];
    let totalAmount = 0;

    for (let day = 0; day < 28; day++) {
      // Calculate daily amount: 2 + (day * 2), capped at 56
      const dailyAmount = Math.min(2 + day * 2, 56);
      totalAmount += dailyAmount;

      dailyRewards.push({
        type: DailyRewardType.STARS,
        amount: dailyAmount,
        totalAmount: totalAmount,
        rewardDate: new Date(Date.now() + 86400000 * day),
      });
    }

    // Create the daily rewards
    const createdDailyRewards = await prisma.dailyReward.createMany({
      data: dailyRewards,
      skipDuplicates: true,
    });

    console.log(`Created ${createdDailyRewards.count} daily rewards`);
    console.log('Daily rewards breakdown:');
    dailyRewards.forEach((reward, index) => {
      console.log(
        `Day ${index}: ${reward.amount} stars/day | Total: ${reward.totalAmount} stars`,
      );
    });
  } catch (error) {
    console.error('Error in daily rewards seed:', error);
    throw error;
  }
}
