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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
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
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Shita',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/shita.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Niyaniya',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/niyaniya.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Nidari',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/nidari.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Ichida',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/ichida.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Hohoemu',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/hohoemu.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Hiraku',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/hiraku.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.MOUTH,
      name: 'Fudan',
      description: 'The mouth of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/mouth/fudan.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Teppa',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/teppa.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Rokusu',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/rokusu.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Raito',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/raito.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Poniteru',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/poniteru.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Mijikai',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/mijikai.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Kusege',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/kusege.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Bouken',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/bouken.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.HAIR,
      name: 'Bocchangari',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/bocchangari.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Yashinteki',
      description: 'The hair of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/yashinteki-yellow.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Niyatsuku',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/niyatsuku.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Nanpo',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/nanpo-red.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Majime',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/majime-blue.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Konryoku',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/konryoku-orange-green.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.EYES,
      name: 'Karui',
      description: 'The eyes of an alien',
      image:
        'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/karui-black.png',
      price: 0,
      isDefault: true,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
    },
    {
      type: AlienPartType.BODY,
      name: "Olympian's Wear",
      description: "Olympian's Wear",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/olympian's_wear.png",
      price: 600,
      power: 50,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      forgeTime: 14400, // 4 hours
    },
    {
      type: AlienPartType.BODY,
      name: "Smoking Black",
      description: "Smoking Black",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/smoking_black.png",
      price: 2000,
      power: 150,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.RARE,
      forgeRuneAmount: 1,
      forgeTime: 57600, // 16 hours
    },
    {
      type: AlienPartType.EYES,
      name: "Blind",
      description: "Blind",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/blind.png",
      price: 600,
      power: 65,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      forgeTime: 14400, // 4 hours
    },
    {
      type: AlienPartType.HAIR,
      name: "Alienzone Cap",
      description: "Alienzone Cap",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/alienzone_cap.png",
      price: 1200,
      power: 100,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.COMMON,
      forgeRuneAmount: 1,
      forgeTime: 28800, // 8 hours
    },
    {
      type: AlienPartType.HAIR,
      name: "Blue Cap",
      description: "Alienzone Cap",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/alienzone_cap.png",
      price: 600,
      power: 50,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      forgeTime: 14400, // 4 hours
    },
    {
      type: AlienPartType.BODY,
      name: "Murasaki Armor",
      description: "Murasaki Armor",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/murasaki_armor.png",
      price: 1200,
      power: 130,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.COMMON,
      forgeRuneAmount: 1,
      forgeTime: 28800, // 8 hours
    },
    {
      type: AlienPartType.MOUTH,
      name: "Golden Grillz",
      description: "Golden Grillz",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/golden_grillz.png",
      price: 1200,
      power: 80,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.COMMON,
      forgeRuneAmount: 1,
      forgeTime: 28800, // 8 hours
    },
    {
      type: AlienPartType.EYES,
      name: "The Strongest",
      description: "The Strongest",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/the_strongest.png",
      price: 1000,
      power: 170,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.RARE,
      forgeRuneAmount: 1,
      forgeTime: 57600, // 16 hours
    },
    {
      type: AlienPartType.BODY,
      name: "Aoi Armor",
      description: "Aoi Armor",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/aoi_armor.png",
      price: 1200,
      power: 130,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.COMMON,
      forgeRuneAmount: 1,
      forgeTime: 28800, // 8 hours
    },
    {
      type: AlienPartType.EYES,
      name: "Dante's Glasses",
      description: "Dante's Glasses",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/dante's_glasses.png",
      price: 600,
      power: 55,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      forgeTime: 14400, // 4 hours
    },
    {
      type: AlienPartType.BODY,
      name: 'Pepe Wear',
      description: 'Pepe Wear',
      image:
        'https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/pepe_wear.png',
      price: 600,
      power: 60,
      isDefault: false,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      forgeTime: 14400, // 4 hours
    },
    {
      type: AlienPartType.HAIR,
      name: 'Pepe Hood',
      description: 'Pepe Hood',
      image:
        'https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/pepe_hood.png',
      price: 600,
      power: 60,
      isForgeable: true,
      forgeRuneType: RuneType.UNCOMMON,
      forgeRuneAmount: 1,
      starBoost: 0,
      xpBoost: 0,
      raidTimeBoost: 0,
      isDefault: false,
      forgeTime: 14400, // 4 hours
    },
    // {
    //   type: AlienPartType.HAIR,
    //   name: 'Hair n Skull',
    //   description: 'Hair n Skull',
    //   image:
    //     'https://alienzone-v2.s3.us-west-1.amazonaws.com/forge-items/Hair+n+Skull.png',
    //   price: 1,
    //   power: 100,
    //   isDefault: false,
    //   isForgeable: true,
    //   forgeRuneType: RuneType.EPIC,
    //   forgeRuneAmount: 1,
    //   starBoost: 0,
    //   xpBoost: 0,
    //   raidTimeBoost: 0,
    // },
    {
      type: AlienPartType.BACKGROUND,
      name: "Akairo's Lands",
      description: "Akairo's Lands",
      image:
        "https://alienzone-v2.s3.us-west-1.amazonaws.com/store-items/Akairo's+Lands.png",
      price: 1,
      isDefault: false,
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
        starBoost: 19,
        xpBoost: 14,
        raidTimeBoost: 10,
      },
      {
        type: AlienPartType.EYES,
        name: 'Elf Alien Eyes',
        description: 'The eyes of an elf alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/eyes/elf.png',
        price: 1,
        isDefault: false,
        starBoost: 14,
        xpBoost: 19,
        raidTimeBoost: 12,
      },
      {
        type: AlienPartType.BODY,
        name: 'Elf Alien Body',
        description: 'The body of an elf alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/elf.png',
        price: 1,
        isDefault: false,
        starBoost: 16,
        xpBoost: 16,
        raidTimeBoost: 16,
      },
      {
        type: AlienPartType.HAIR,
        name: 'Prisoner Alien Hair',
        description: 'The hair of an prisoner alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/prisoner.png',
        price: 1,
        isDefault: false,
        starBoost: 10,
        xpBoost: 13,
        raidTimeBoost: 22,
      },
      {
        type: AlienPartType.HAIR,
        name: 'Ninja Alien Hair',
        description: 'The hair of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/hair/ninja.png',
        price: 1,
        isDefault: false,
        starBoost: 13,
        xpBoost: 22,
        raidTimeBoost: 10,
      },
      {
        type: AlienPartType.BODY,
        name: 'Prisoner Alien Body',
        description: 'The body of an prisoner alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/prisoner.png',
        price: 1,
        isDefault: false,
        starBoost: 12,
        xpBoost: 12,
        raidTimeBoost: 24,
      },
      {
        type: AlienPartType.BODY,
        name: 'Ninja Alien Body',
        description: 'The body of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/body/ninja.png',
        price: 1,
        isDefault: false,
        starBoost: 15,
        xpBoost: 25,
        raidTimeBoost: 8,
      },
      {
        type: AlienPartType.MARKS,
        name: 'Ninja Alien Marks',
        description: 'The marks of an ninja alien',
        image:
          'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/marks/ninja.png',
        price: 1,
        isDefault: false,
        starBoost: 18,
        xpBoost: 18,
        raidTimeBoost: 9,
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
