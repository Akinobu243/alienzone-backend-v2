import { PrismaClient, PackRewardType, PackType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  // Get references to existing data
  const elements = await prisma.element.findMany();
  const alienParts = await prisma.alienPart.findMany();
  const characters = await prisma.character.findMany();

  if (elements.length === 0 || alienParts.length === 0) {
    throw new Error('Elements and alien parts must be seeded first');
  }

  await prisma.packReward.deleteMany();
  await prisma.pack.deleteMany();

  // Create packs
  const specialPacks = [
    {
      name: 'Starter Pack',
      description: 'Perfect for beginners, contains basic items and resources',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/pack1.png',
      price: 4.99,
      isActive: true,
      type: PackType.SPECIAL,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 500,
          },
          {
            type: PackRewardType.XP,
            amount: 200,
          },
          {
            type: PackRewardType.ALIEN_PARTS,
            alienParts: {
              connect: [{ id: alienParts[0].id }, { id: alienParts[1].id }],
            },
          },
        ],
      },
    },
    {
      name: 'Element Pack',
      description: 'Unlock new elements for your aliens',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/pack2.png',
      price: 9.99,
      isActive: true,
      type: PackType.SPECIAL,
      rewards: {
        create: [
          {
            type: PackRewardType.ELEMENT,
            element: {
              connect: { id: elements[0].id },
            },
          },
          {
            type: PackRewardType.STARS,
            amount: 1000,
          },
        ],
      },
    },
    {
      name: 'Character Pack',
      description: 'Unlock powerful new characters',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/pack3.png',
      price: 14.99,
      isActive: true,
      type: PackType.SPECIAL,
      rewards: {
        create:
          characters.length > 0
            ? [
                {
                  type: PackRewardType.CHARACTER,
                  character: {
                    connect: { id: characters[0].id },
                  },
                },
                {
                  type: PackRewardType.REP,
                  amount: 300,
                },
              ]
            : [
                {
                  type: PackRewardType.STARS,
                  amount: 2000,
                },
                {
                  type: PackRewardType.REP,
                  amount: 500,
                },
              ],
      },
    },
  ];

  const starsPacks = [
    {
      name: 'Pile of STARS',
      description: '500 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack1.png',
      price: 6.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 500,
          },
        ],
      },
    },
    {
      name: 'Big Pile of STARS',
      description: '1000 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack1.png',
      price: 10.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 1000,
          },
        ],
      },
    },
    {
      name: 'Bag of STARS',
      description: '2500 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack2.png',
      price: 24.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 2500,
          },
        ],
      },
    },
    {
      name: 'Three bag of STARS',
      description: '5000 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack3.png',
      price: 39.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 5000,
          },
        ],
      },
    },
    {
      name: 'Case of STARS',
      description: '10000 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack4.png',
      price: 74.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 10000,
          },
        ],
      },
    },
    {
      name: 'Box of STARS',
      description: '25000 STARS',
      image: 'https://alienzone-v2.s3.amazonaws.com/packs/star-pack5.png',
      price: 144.99,
      isActive: true,
      type: PackType.STARS,
      rewards: {
        create: [
          {
            type: PackRewardType.STARS,
            amount: 25000,
          },
        ],
      },
    },
  ];

  for (const pack of [...specialPacks, ...starsPacks]) {
    await prisma.pack.create({
      data: pack,
    });
  }

  console.log('Packs seeded successfully');
}
