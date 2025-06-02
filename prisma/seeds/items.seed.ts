import {
  PrismaClient,
  ItemType,
  ItemQuality,
  GearItemRarity,
  GearItemType,
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
      description: 'Increase star reward amounts by 2%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Bronze%20Shears.png',
    },
    {
      type: ItemType.SHEARS,
      quality: ItemQuality.SILVER,
      description: 'Increase star reward amounts by 4%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Silver%20Shears.png',
    },
    {
      type: ItemType.SHEARS,
      quality: ItemQuality.GOLDEN,
      description: 'Increase star reward amounts by 8%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Golden%20Shears.png',
    },
    {
      type: ItemType.CUT,
      quality: ItemQuality.BRONZE,
      description: 'Decrease raid time by 2%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Bronze%20Cut.png',
    },
    {
      type: ItemType.CUT,
      quality: ItemQuality.SILVER,
      description: 'Decrease raid time by 4%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Silver%20Cut.png',
    },
    {
      type: ItemType.CUT,
      quality: ItemQuality.GOLDEN,
      description: 'Decrease raid time by 8%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Golden%20Cut.png',
    },
    {
      type: ItemType.KNIFE,
      quality: ItemQuality.BRONZE,
      description: 'Increase XP reward amounts by 2%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Bronze%20Knife.png',
    },
    {
      type: ItemType.KNIFE,
      quality: ItemQuality.SILVER,
      description: 'Increase XP reward amounts by 4%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Silver%20Knife.png',
    },
    {
      type: ItemType.KNIFE,
      quality: ItemQuality.GOLDEN,
      description: 'Increase XP reward amounts by 8%',
      image:
        'https://alienzone-v2.s3.amazonaws.com/buff-items/Golden%20Knife.png',
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
      type: GearItemType.TEMBIN,
    },
    {
      rarity: GearItemRarity.UNCOMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Eternal%20Ice%20(The Twins).png',
      type: GearItemType.TWINS,
    },
    {
      rarity: GearItemRarity.RARE,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Flask%20(Dante).png',
      type: GearItemType.DANTE,
    },
    {
      rarity: GearItemRarity.COMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Nano-Quantic%20Reactor%20(Nikola).png',
      type: GearItemType.NIKOLA,
    },
    {
      rarity: GearItemRarity.UNCOMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Seal%20of%20the%20mystic%20guard%20(Karushi).png',
      type: GearItemType.KARUSHI,
    },
    {
      rarity: GearItemRarity.COMMON,
      image:
        'https://alienzone-v2.s3.amazonaws.com/gear-items/Woolball%20(Shishi%20Cat).png',
      type: GearItemType.SHISHI,
    },
  ];

  for (const gearItem of gearItems) {
    await prisma.gearItem.create({
      data: gearItem,
    });
  }

  console.log('Items and gear items seeded successfully');
}
