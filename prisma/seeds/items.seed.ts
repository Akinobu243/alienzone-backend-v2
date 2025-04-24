import {
  PrismaClient,
  ItemType,
  ItemQuality,
  GearItemRarity,
} from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  // Get character references for gear items
  const characters = await prisma.character.findMany();

  await prisma.item.deleteMany();
  await prisma.gearItem.deleteMany();

  // Create regular items
  const items = [
    {
      type: ItemType.SHEARS,
      quality: ItemQuality.BRONZE,
      description: 'Basic shears for cutting alien plants',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Woolball%20(Shishi%20Cat).png',
    },
    {
      type: ItemType.SHEARS,
      quality: ItemQuality.SILVER,
      description: 'Medium quality shears for cutting alien plants',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Seal%20of%20the%20mystic%20guard%20(Karushi).png',
    },
    {
      type: ItemType.SHEARS,
      quality: ItemQuality.GOLDEN,
      description: 'High quality shears for cutting alien plants',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Nano-Quantic%20Reactor%20(Nikola).png',
    },
    {
      type: ItemType.CUT,
      quality: ItemQuality.BRONZE,
      description: 'Basic cutting tool for alien materials',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Flask%20(Dante).png',
    },
    {
      type: ItemType.CUT,
      quality: ItemQuality.SILVER,
      description: 'Medium quality cutting tool for alien materials',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Eternal%20Ice%20(The%20Twins).png',
    },
    {
      type: ItemType.KNIFE,
      quality: ItemQuality.BRONZE,
      description: 'Basic knife for alien crafting',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
    },
    {
      type: ItemType.KNIFE,
      quality: ItemQuality.GOLDEN,
      description: 'High quality knife for alien crafting',
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
    },
  ];

  for (const item of items) {
    await prisma.item.create({
      data: item,
    });
  }

  // Create gear items
  const gearItems = [
    {
      rarity: GearItemRarity.COMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
      summonedCharacterId: characters.length > 0 ? characters[0].id : null,
    },
    {
      rarity: GearItemRarity.UNCOMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
      summonedCharacterId: null,
    },
    {
      rarity: GearItemRarity.RARE,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
      summonedCharacterId: characters.length > 1 ? characters[1].id : null,
    },
    {
      rarity: GearItemRarity.COMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
      summonedCharacterId: null,
    },
    {
      rarity: GearItemRarity.UNCOMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Daffodil%20(Tembin).png',
      summonedCharacterId: null,
    },
  ];

  for (const gearItem of gearItems) {
    await prisma.gearItem.create({
      data: gearItem,
    });
  }

  console.log('Items and gear items seeded successfully');
}
