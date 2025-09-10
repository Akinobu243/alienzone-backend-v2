import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Updating daily rewards with totalAmount...');

    // Define the totalAmount values for each day (0-indexed)
    const totalAmounts = [
      2, // Day 0
      8, // Day 1
      18, // Day 2
      32, // Day 3
      50, // Day 4
      120, // Day 5
      168, // Day 6
      224, // Day 7
      288, // Day 8
      360, // Day 9
      440, // Day 10
      528, // Day 11
      650, // Day 12
      784, // Day 13
      930, // Day 14
      1088, // Day 15
      1258, // Day 16
      1440, // Day 17
      1634, // Day 18
      1840, // Day 19
      2058, // Day 20
      2288, // Day 21
      2530, // Day 22
      2784, // Day 23
      3100, // Day 24
      3432, // Day 25
      3780, // Day 26
      4144, // Day 27
    ];

    // Get all existing daily rewards ordered by rewardDate
    const existingRewards = await prisma.dailyReward.findMany({
      orderBy: {
        rewardDate: 'asc',
      },
    });

    console.log(`Found ${existingRewards.length} existing daily rewards`);

    // Update each reward with the corresponding totalAmount
    let updateCount = 0;
    for (
      let i = 0;
      i < existingRewards.length && i < totalAmounts.length;
      i++
    ) {
      const reward = existingRewards[i];
      const totalAmount = totalAmounts[i];

      await prisma.dailyReward.update({
        where: {
          id: reward.id,
        },
        data: {
          totalAmount: totalAmount,
        },
      });

      updateCount++;
      console.log(
        `Updated reward ${reward.id} with totalAmount: ${totalAmount}`,
      );
    }

    console.log(
      `Successfully updated ${updateCount} daily rewards with totalAmount`,
    );
  } catch (error) {
    console.error('Error updating daily rewards:', error);
    throw error;
  }
}
