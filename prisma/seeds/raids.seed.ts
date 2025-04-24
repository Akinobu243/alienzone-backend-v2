import { PrismaClient, RewardType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  // First, get element IDs to reference
  const elements = await prisma.element.findMany();
  await prisma.raid.deleteMany();
  await prisma.raidReward.deleteMany();

  if (elements.length === 0) {
    throw new Error('Elements must be seeded first');
  }

  // Create raid rewards
  const raidRewards = [
    {
      type: RewardType.STARS,
      amount: 100,
    },
    {
      type: RewardType.XP,
      amount: 50,
    },
    {
      type: RewardType.STARS,
      amount: 200,
    },
    {
      type: RewardType.XP,
      amount: 100,
    },
  ];

  const createdRewards = [];
  for (const reward of raidRewards) {
    const createdReward = await prisma.raidReward.create({
      data: reward,
    });
    createdRewards.push(createdReward);
  }

  // Create raids
  const raids = [
    {
      title: 'Water Temple Raid',
      description: 'Explore the ancient water temple and defeat the guardian',
      duration: 3600, // 1 hour in seconds
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      elementId: elements.find((e) => e.name === 'Water')?.id || elements[0].id,
      rewards: {
        connect: [{ id: createdRewards[0].id }, { id: createdRewards[1].id }],
      },
    },
    {
      title: 'Fire Mountain Raid',
      description: 'Climb the fire mountain and collect rare fire crystals',
      duration: 7200, // 2 hours in seconds
      image: 'https://alienzone-v2.s3.amazonaws.com/raids/raid-1.jpeg',
      elementId: elements.find((e) => e.name === 'Fire')?.id || elements[1].id,
      rewards: {
        connect: [{ id: createdRewards[2].id }, { id: createdRewards[3].id }],
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
        connect: [{ id: createdRewards[0].id }, { id: createdRewards[3].id }],
      },
    },
  ];

  for (const raid of raids) {
    await prisma.raid.create({
      data: raid,
    });
  }

  console.log('Raids seeded successfully');
}
