import { PrismaClient, AlienPartType, RuneType } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  const elements = [
    {
      id: 1,
      name: 'Water',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/water.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/water-bg.png',
      weaknessId: 3, // Thunder
      strengthId: 2, // Fire
      isDefault: true,
    },
    {
      id: 2,
      name: 'Fire',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/fire.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/fire-bg.png',
      weaknessId: 1, // Water
      strengthId: 5, // Love
      isDefault: true,
    },
    {
      id: 3,
      name: 'Thunder',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/thunder.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/thunder-bg.png',
      weaknessId: 4, // Plasma
      strengthId: 1, // Water
      isDefault: true,
    },
    {
      id: 4,
      name: 'Plasma',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/plasma.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/plasma-bg.png',
      weaknessId: 7, // Gravity
      strengthId: 3, // Thunder
      isDefault: true,
    },
    {
      id: 5,
      name: 'Love',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/love.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/love-bg.png',
      weaknessId: 2, // Fire
      strengthId: 8, // Gamma
      isDefault: true,
    },
    {
      id: 6,
      name: 'Life',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/life.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/life-bg.png',
      weaknessId: 1, // Water
      strengthId: 7, // Gravity
      isDefault: true,
    },
    {
      id: 7,
      name: 'Gravity',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gravity.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gravity-bg.png',
      weaknessId: 6, // Life
      strengthId: 4, // Plasma
      isDefault: true,
    },
    {
      id: 8,
      name: 'Gamma',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gamma.png',
      background:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gamma-bg.png',
      weaknessId: 5, // Love
      strengthId: 6, // Life
      isDefault: true,
    },
  ];
  const alienParts = [
    {
      type: AlienPartType.MOUTH,
      name: 'Tsuujou',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/tsuujou.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Shita',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/shita.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Niyaniya',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/niyaniya.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Nidari',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/nidari.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Ichida',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/ichida.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Hohoemu',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/hohoemu.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Hiraku',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/hiraku.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Fudan',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/fudan.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Teppa',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/teppa.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Rokusu',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/rokusu.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Raito',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/raito.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Poniteru',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/poniteru.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Mijikai',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/mijikai.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Kusege',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/kusege.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Bouken',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/bouken.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Bocchangari',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/bocchangari.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Bocchangari',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/yashinteki-yellow.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Niyatsuku',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/niyatsuku.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Nanpo',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/nanpo-red.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Majime',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/majime-blue.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Konryoku',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/konryoku-orange-green.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Karui',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/karui-black.png',
      price: 0,
      isDefault: true,
    },
    {
      type: AlienPartType.EYES,
      name: 'Fukai',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/fukai-grey.png',
      price: 0,
      isDefault: true,
      isForgeable: true,
      forgeRuneType: RuneType.LEGENDARY,
      forgeRuneAmount: 1,
    },
    {
      type: AlienPartType.EYES,
      name: 'Choroi',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/choroi.png',
      price: 0,
      isForgeable: true,
      forgeRuneType: RuneType.RARE,
      forgeRuneAmount: 1,
      isDefault: true,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Prisoner Alien Hair',
      description: 'The hair of an prisoner alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/prisoner.png',
      price: 1,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.COMMON,
      forgeRuneAmount: 1,
    },
  ];

  try {
    console.log('Seeding alien parts and elements...');
    // Clear existing data first
    await prisma.alienPart.deleteMany({});

    // First, find all characters
    const characters = await prisma.character.findMany();

    if (characters.length > 0) {
      // Delete characters first since they depend on elements
      await prisma.character.deleteMany({});
    }

    // Find aliens that reference elements
    const aliens = await prisma.alien.findMany();

    if (aliens.length > 0) {
      // Delete aliens first since they depend on elements
      await prisma.alien.deleteMany({});
    }

    // Delete Raid records first since they reference elements
    await prisma.raid.deleteMany({});

    // Delete UserElement records first since they reference elements
    await prisma.userElement.deleteMany({});

    // Now it's safe to delete elements
    await prisma.element.deleteMany({});

    // Create new records
    const createdAlienParts = await prisma.alienPart.createMany({
      data: alienParts,
      skipDuplicates: true,
    });

    const createdElements = await prisma.element.createMany({
      data: elements,
      skipDuplicates: true,
    });

    // Elf Alien  parsts and group
    const elfParts = [
      {
        type: AlienPartType.HAIR,
        name: 'Elf Alien Hair',
        description: 'The hair of an elf alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/elf.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.EYES,
        name: 'Elf Alien Eyes',
        description: 'The eyes of an elf alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/elf.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.BODY,
        name: 'Elf Alien Body',
        description: 'The body of an elf alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/elf.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.HAIR,
        name: 'Prisoner Alien Hair',
        description: 'The hair of an prisoner alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/prisoner.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.HAIR,
        name: 'Ninja Alien Hair',
        description: 'The hair of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/ninja.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.BODY,
        name: 'Prisoner Alien Body',
        description: 'The body of an prisoner alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/prisoner.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.BODY,
        name: 'Ninja Alien Body',
        description: 'The body of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/ninja.png',
        price: 1,
        isDefault: false,
      },
      {
        type: AlienPartType.MARKS,
        name: 'Ninja Alien Marks',
        description: 'The marks of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/marks/ninja.png',
        price: 1,
        isDefault: false,
      },
    ];

    const elfElements = [
      {
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/elf.png',
        background:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/elf.png',
        name: 'Elf',
        isDefault: false,
      },
      {
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/ninja.png',
        background:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/ninja.png',
        name: 'Ninja',
        isDefault: false,
      },
      {
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/prisoner.png',
        background:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/prisoner.png',
        name: 'Prisoner',
        isDefault: false,
      },
    ];
    const createdElfParts = await prisma.alienPart.createMany({
      data: elfParts,
      skipDuplicates: true,
    });

    const createdElfElements = await prisma.element.createMany({
      data: elfElements,
      skipDuplicates: true,
    });

    console.log(`Created ${createdAlienParts.count} alien parts`);
  } catch (error) {
    console.error('Error in parts seed:', error);
    throw error;
  }
}
