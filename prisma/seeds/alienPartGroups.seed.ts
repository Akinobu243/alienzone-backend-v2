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
        walletAddress: '0x5e5f66760933bf543db9c6cc6096ad30ceadabbc',
      },
    });

    if (!user) {
      console.error(
        'User with wallet address 0x3f1962b14640883d70ea33439f8f8826ef0cd6e7 not found',
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
                (part.type === AlienPartType.EYES &&
                  (part.name.includes('Fukai') ||
                    part.name.includes('Majime'))) ||
                (part.type === AlienPartType.HAIR &&
                  (part.name.includes('Mijikai') ||
                    part.name.includes('Raito'))) ||
                (part.type === AlienPartType.MOUTH &&
                  (part.name.includes('Tsuujou') ||
                    part.name.includes('Hiraku'))),
            )
            .map((part) => ({ id: part.id })),
        },
      },
      {
        name: 'Fire Alien Collection',
        description: 'A collection of fire-themed alien parts',
        userId: user.id,
        elementId: elementMap['Fire'] || null,
        parts: {
          connect: alienParts
            .filter(
              (part) =>
                (part.type === AlienPartType.EYES &&
                  (part.name.includes('Nanpo') ||
                    part.name.includes('Konryoku'))) ||
                (part.type === AlienPartType.HAIR &&
                  (part.name.includes('Teppa') ||
                    part.name.includes('Kusege'))) ||
                (part.type === AlienPartType.MOUTH &&
                  (part.name.includes('Nidari') ||
                    part.name.includes('Niyaniya'))),
            )
            .map((part) => ({ id: part.id })),
        },
      },
      {
        name: 'Special Alien Collection',
        description: 'A collection of special alien parts',
        userId: user.id,
        elementId: null, // No specific element
        parts: {
          connect: alienParts
            .filter(
              (part) =>
                part.name.includes('Elf') ||
                part.name.includes('Ninja') ||
                part.name.includes('Prisoner'),
            )
            .map((part) => ({ id: part.id })),
        },
      },
      {
        name: 'Face Collection',
        description: 'A collection of alien face parts',
        userId: user.id,
        elementId: null, // No specific element
        parts: {
          connect: alienParts
            .filter((part) => part.type === AlienPartType.FACE)
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
      // Delete existing element background parts
      // const existingBackgroundParts = await prisma.alienPart.findMany({
      //   where: {
      //     type: AlienPartType.BACKGROUND,
      //     name: {
      //       startsWith: 'Element:',
      //     },
      //   },
      // });

      // if (existingBackgroundParts.length > 0) {
      //   // Find all groups that have these parts
      //   for (const part of existingBackgroundParts) {
      //     // Find groups that contain this part
      //     const groupsWithPart = await prisma.alienPartGroup.findMany({
      //       where: {
      //         parts: {
      //           some: {
      //             id: part.id,
      //           },
      //         },
      //       },
      //     });

      //     // Disconnect the part from each group
      //     for (const group of groupsWithPart) {
      //       await prisma.alienPartGroup.update({
      //         where: { id: group.id },
      //         data: {
      //           parts: {
      //             disconnect: { id: part.id },
      //           },
      //         },
      //       });
      //     }
      //   }

      //   // Now delete the parts
      //   await prisma.alienPart.deleteMany({
      //     where: {
      //       id: {
      //         in: existingBackgroundParts.map((part) => part.id),
      //       },
      //     },
      //   });

      //   console.log(
      //     `Deleted ${existingBackgroundParts.length} existing background parts`,
      //   );
      // }

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
