import { PrismaClient, RewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  // First, get element IDs to reference
  const elements = await prisma.element.findMany();
  await prisma.raid.deleteMany({
    where: {
      isHunt: true,
    },
  });

  if (elements.length === 0) {
    throw new Error('Elements must be seeded first');
  }

  // Create raid rewards
  const raidRewards = await prisma.raidReward.findMany();

  // Create raids
  const raids = [
    {
      title: 'Water Temple Raid',
      description: 'Explore the ancient water temple and defeat the guardian',
      duration: 3600, // 1 hour in seconds
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      elementId: elements.find((e) => e.name === 'Water')?.id || elements[0].id,
      rewards: {
        connect: [{ id: raidRewards[0].id }, { id: raidRewards[1].id }],
      },
    },
    {
      title: 'Fire Mountain Raid',
      description: 'Climb the fire mountain and collect rare fire crystals',
      duration: 7200, // 2 hours in seconds
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      elementId: elements.find((e) => e.name === 'Fire')?.id || elements[1].id,
      rewards: {
        connect: [{ id: raidRewards[2].id }, { id: raidRewards[3].id }],
      },
    },
    {
      title: 'Thunder Plains Raid',
      description:
        'Cross the dangerous thunder plains and harness lightning power',
      duration: 5400, // 1.5 hours in seconds
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      elementId:
        elements.find((e) => e.name === 'Thunder')?.id || elements[2].id,
      rewards: {
        connect: [{ id: raidRewards[0].id }, { id: raidRewards[3].id }],
      },
    },
    {
      title: 'Hunt 1',
      description: 'Hunt for rare items in the forest',
      duration: 1800, // 30 minutes in seconds
      elementId: elements.find((e) => e.name === 'Earth')?.id || elements[3].id,
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      rewards: {
        connect: [{ id: raidRewards[0].id }, { id: raidRewards[1].id }],
      },
      isHunt: true,
    },
  ];

  for (const raid of raids) {
    await prisma.raid.create({
      data: { ...raid, isHunt: true },
    });
  }

  console.log('Raids seeded successfully');
}
