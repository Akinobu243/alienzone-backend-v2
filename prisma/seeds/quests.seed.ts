import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Seeding quests...');

    await prisma.quest.deleteMany({});

    // Daily Quests
    await prisma.quest.createMany({
      data: [
        {
          type: 'login',
          frequency: 'daily',
          description: 'Login',
          requiredNumber: 1,
          rewards: { stars: 20 },
        },
        {
          type: 'message',
          frequency: 'daily',
          description: 'Send a message in chat',
          requiredNumber: 1,
          rewards: { stars: 20 },
        },
        {
          type: 'wheel',
          frequency: 'daily',
          description: 'Use the wheel 3 times',
          requiredNumber: 3,
          rewards: { stars: 30 },
        },
        {
          type: 'raid',
          frequency: 'daily',
          description: 'Launch 1 Raid',
          requiredNumber: 1,
          rewards: { stars: 30 },
        },
      ],
    });

    // Weekly Quests
    await prisma.quest.createMany({
      data: [
        {
          type: 'login',
          frequency: 'weekly',
          description: 'Login 5 times',
          requiredNumber: 5,
          rewards: { stars: 40, runes: ['COMMON'] },
        },
        {
          type: 'message',
          frequency: 'weekly',
          description: 'Send 5 chat messages',
          requiredNumber: 5,
          rewards: { stars: 40, runes: ['UNCOMMON'] },
        },
        {
          type: 'wheel',
          frequency: 'weekly',
          description: 'Use Wheel 15 times',
          requiredNumber: 15,
          rewards: { stars: 60, runes: ['RARE'] },
        },
        {
          type: 'raid',
          frequency: 'weekly',
          description: 'Launch 5 raids',
          requiredNumber: 5,
          rewards: { stars: 60, runes: ['EPIC'] },
        },
        {
          type: 'buy',
          frequency: 'weekly',
          description: 'Buy in the store',
          requiredNumber: 1,
          rewards: { stars: 100, runes: ['LEGENDARY'] },
        },
      ],
    });

    // General Quests
    const generalQuests = [];

    // Reach level X
    for (let level = 10; level <= 100; level += 10) {
      generalQuests.push({
        type: 'level',
        frequency: 'general',
        description: `Reach level ${level}`,
        requiredNumber: level,
        rewards: { stars: 100 },
      });
    }

    // Complete X Raids
    for (let raids = 1; raids <= 100; raids += raids < 10 ? 1 : 10) {
      generalQuests.push({
        type: 'raid',
        frequency: 'general',
        description: `Complete ${raids} Raids`,
        requiredNumber: raids,
        rewards: { stars: 100 },
      });
    }

    // Obtain X Tier 3 characters
    for (let characters = 1; characters <= 10; characters++) {
      generalQuests.push({
        type: 'T3Characters',
        frequency: 'general',
        description: `Obtain ${characters} Tier 3 characters`,
        requiredNumber: characters,
        rewards: { stars: 200 },
      });
    }

    // Get X UR Characters
    for (let ur = 1; ur <= 9; ur += ur < 5 ? 2 : 2) {
      generalQuests.push({
        type: 'URCharacters',
        frequency: 'general',
        description: `Get ${ur} UR Character${ur > 1 ? 's' : ''}`,
        requiredNumber: ur,
        rewards: { stars: 100 },
      });
    }

    await prisma.quest.createMany({ data: generalQuests });
    console.log('Quests seeded successfully');
  } catch (error) {
    console.error('Error seeding quests:', error);
    throw error;
  }
}
