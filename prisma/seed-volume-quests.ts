import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for Zone Based Volume Quests.
 * These are monthly quests that reward Stars based on ZONE trading volume.
 * 
 * Run with: npx ts-node prisma/seed-volume-quests.ts
 */
async function main() {
  const volumeQuests = [
    { volume: 10000, stars: 100 },
    { volume: 20000, stars: 200 },
    { volume: 30000, stars: 300 },
    { volume: 40000, stars: 400 },
    { volume: 50000, stars: 500 },
    { volume: 60000, stars: 600 },
    { volume: 70000, stars: 700 },
    { volume: 80000, stars: 800 },
    { volume: 90000, stars: 900 },
    { volume: 100000, stars: 2000 },
  ];

  for (const quest of volumeQuests) {
    await prisma.quest.create({
      data: {
        type: 'volume',
        frequency: 'monthly',
        description: `Trade ${quest.volume.toLocaleString()} ZONE volume on the Store`,
        requiredNumber: quest.volume,
        rewards: { stars: quest.stars },
      },
    });
  }

  console.log('Volume quests seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
