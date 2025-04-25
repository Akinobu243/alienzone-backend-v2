import { PrismaClient, AlienPartType } from '@prisma/client';

const backgrounds = [
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/water.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/water-bg.png',
    name: 'Water',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/fire.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/fire-bg.png',
    name: 'Fire',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/thunder.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/thunder-bg.png',
    name: 'Thunder',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/plasma.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/plasma-bg.png',
    name: 'Plasma',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/love.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/love-bg.png',
    name: 'Love',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/life.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/life-bg.png',
    name: 'Life',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gravity.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gravity-bg.png',
    name: 'Gravity',
    isDefault: true,
  },
  {
    image:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gamma.png',
    background:
      'https://alienzone-v2.s3.dualstack.us-west-1.amazonaws.com/traits/elements/gamma-bg.png',
    name: 'Gamma',
    isDefault: true,
  },
];

export async function seed(prisma: PrismaClient) {
  try {
    // Find the user with the specified wallet address
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: '0xe909059141ecc0e88181405d6a716292d5bd14cd',
      },
    });

    if (!user) {
      console.error(
        'User with wallet address 0xe909059141ecc0e88181405d6a716292d5bd14cd not found',
      );
      return;
    }

    // Award 200 stars to the user
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stars: {
          increment: 200,
        },
      },
    });

    // console.log(`Awarded 200 stars to user ${user.name}`);

    // // Find elements to associate with the groups - don't create new ones
    // const elements = await prisma.element.findMany();

    // const elementMap = elements.reduce((map, element) => {
    //   map[element.name] = element.id;
    //   return map;
    // }, {});

    // // Find alien parts to include in the groups
    // const alienParts = await prisma.alienPart.findMany();

    console.log(`Awarded 200 stars to user ${user.name}`);

    // Find elements to associate with the groups - don't create new ones
    const elements = await prisma.element.findMany();

    const elementMap = elements.reduce((map, element) => {
      map[element.name] = element.id;
      return map;
    }, {});

    // Find alien parts to include in the groups
    const alienParts = await prisma.alienPart.findMany();

    // Get the user with their alien parts
    const userWithParts = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        AlienParts: true,
      },
    });

    // Get IDs of parts the user already has
    const userAlienPartIds = userWithParts.AlienParts.map((part) => part.id);

    // Find parts that need to be added to user inventory
    const partsToAdd = alienParts
      .filter((part) => !userAlienPartIds.includes(part.id))
      .map((part) => ({ id: part.id }));

    // Add missing parts to user inventory
    if (partsToAdd.length > 0) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          AlienParts: {
            connect: partsToAdd,
          },
        },
      });
      console.log(
        `Added ${partsToAdd.length} missing alien parts to user inventory`,
      );
    }

    // Group parts by type
    const partsByType = alienParts.reduce((acc, part) => {
      if (!acc[part.type]) {
        acc[part.type] = [];
      }
      acc[part.type].push(part);
      return acc;
    }, {});

    // Define the alien part groups
    const alienPartGroups = [
      {
        name: 'Water Alien Collection',
        description: 'A collection of water-themed alien parts',
        userId: user.id,
        elementId: elementMap['Water'] || null,
        parts: {
          connect: alienParts
            .filter(
              (part) =>
                part.type === AlienPartType.EYES ||
                part.type === AlienPartType.HAIR ||
                part.type === AlienPartType.MOUTH,
            )
            .map((part) => ({ id: part.id })),
        },
      },
      {
        name: 'Element Collection',
        description: 'A collection of all element images',
        userId: user.id,
        elementId: null, // No specific element
        // We don't connect parts here as elements are not alien parts
      },
    ];

    // Clear existing AlienPartGroup data for this user
    await prisma.alienPartGroup.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Create the new AlienPartGroup records
    for (const group of alienPartGroups) {
      await prisma.alienPartGroup.create({
        data: group,
      });
    }

    // Find the Element Collection group we just created
    const elementCollection = await prisma.alienPartGroup.findFirst({
      where: {
        name: 'Element Collection',
        userId: user.id,
      },
    });

    if (elementCollection) {
      const existingUserElements = await prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
      });

      // Delete existing user elements if any
      if (existingUserElements.length > 0) {
        await prisma.userElement.deleteMany({
          where: {
            userId: user.id,
          },
        });
        console.log(
          `Deleted ${existingUserElements.length} existing user elements`,
        );
      }

      // Create UserElement records for each element
      for (const element of elements) {
        await prisma.userElement.create({
          data: {
            userId: user.id,
            elementId: element.id,
          },
        });
      }

      console.log(`Created ${backgrounds.length} new background parts`);
    }

    console.log(
      `Created ${alienPartGroups.length} alien part groups for user ${user.name}`,
    );
  } catch (error) {
    console.error('Error in alienPartGroups seed:', error);
    throw error;
  }
}
