import { PrismaClient, DailyRewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Updating daily rewards...');

    // Get all existing daily rewards ordered by rewardDate
    const existingRewards = await prisma.dailyReward.findMany({
      orderBy: {
        rewardDate: 'asc',
      },
    });

    console.log(`Found ${existingRewards.length} existing daily rewards`);

    // Calculate new values for 28 days
    const dailyRewardsData = [];
    let totalAmount = 0;

    for (let day = 0; day < 28; day++) {
      // Calculate daily amount: 2 + (day * 2), capped at 56
      const dailyAmount = Math.min(2 + day * 2, 56);
      totalAmount += dailyAmount;

      dailyRewardsData.push({
        amount: dailyAmount,
        totalAmount: totalAmount,
      });
    }

    // Update existing rewards
    let updateCount = 0;
    for (let i = 0; i < existingRewards.length && i < 28; i++) {
      const reward = existingRewards[i];
      const newData = dailyRewardsData[i];

      await prisma.dailyReward.update({
        where: {
          id: reward.id,
        },
        data: {
          type: DailyRewardType.STARS,
          amount: newData.amount,
          totalAmount: newData.totalAmount,
          rewardDate: new Date(Date.now() + 86400000 * i),
        },
      });

      updateCount++;
      console.log(
        `Updated reward ${reward.id} - Day ${i}: ${newData.amount} stars/day | Total: ${newData.totalAmount} stars`,
      );
    }

    // If there are fewer than 28 rewards, create the missing ones
    if (existingRewards.length < 28) {
      const missingRewards = [];
      for (let i = existingRewards.length; i < 28; i++) {
        const data = dailyRewardsData[i];
        missingRewards.push({
          type: DailyRewardType.STARS,
          amount: data.amount,
          totalAmount: data.totalAmount,
          rewardDate: new Date(Date.now() + 86400000 * i),
        });
      }

      const created = await prisma.dailyReward.createMany({
        data: missingRewards,
      });

      console.log(`Created ${created.count} missing daily rewards`);
    }

    // If there are more than 28 rewards, delete the extras
    if (existingRewards.length > 28) {
      const rewardsToDelete = existingRewards.slice(28);
      await prisma.dailyReward.deleteMany({
        where: {
          id: {
            in: rewardsToDelete.map((r) => r.id),
          },
        },
      });

      console.log(`Deleted ${rewardsToDelete.length} extra daily rewards`);
    }

    console.log(
      `Successfully updated ${updateCount} daily rewards with new progression system`,
    );
    console.log('Daily rewards breakdown:');
    dailyRewardsData.forEach((reward, index) => {
      console.log(
        `Day ${index}: ${reward.amount} stars/day | Total: ${reward.totalAmount} stars`,
      );
    });
  } catch (error) {
    console.error('Error updating daily rewards:', error);
    throw error;
  }
}
