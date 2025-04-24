import { PrismaClient, CharacterRarity } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  // First, get element IDs to reference
  const elements = await prisma.element.findMany();
  await prisma.character.deleteMany();
  if (elements.length === 0) {
    throw new Error('Elements must be seeded first');
  }

  // Example characters data
  const characters = [
    {
      name: 'Character 1',
      rarity: CharacterRarity.R,
      power: 100,
      image: 'https://alienzone-v2.s3.amazonaws.com/characters/zion.jpg',
      video: null,
      tokenId: 1,
      upgradeReq: null,
      tier: 1,
      elementId: elements[0].id,
    },
    {
      name: 'Character 2',
      rarity: CharacterRarity.SR,
      power: 200,
      image: 'https://alienzone-v2.s3.amazonaws.com/characters/zoe.jpg',
      video: 'character2.mp4',
      tokenId: 2,
      upgradeReq: 3,
      upgradesToId: null,
      tier: 2,
      elementId: elements[1].id,
    },
  ];

  for (const character of characters) {
    await prisma.character.create({
      data: character,
    });
  }

  console.log('Characters seeded successfully');
}
