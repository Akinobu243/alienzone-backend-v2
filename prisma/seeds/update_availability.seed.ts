import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Starting to update alien parts availability...');

    // Get all alien parts that belong to user groups
    const alienParts = await prisma.alienPart.findMany({
      include: {
        AlienPartGroup: {
          where: {
            userId: {
              not: null,
            },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`Found ${alienParts.length} alien parts to process`);

    // Process each part
    for (const part of alienParts) {
      if (part.AlienPartGroup.length > 0) {
        // Get existing availability array or initialize empty array
        const existingAvailability =
          (part.availability as { userId: number; available: number }[]) || [];

        // Get all unique userIds from the groups this part belongs to
        const userIds = [
          ...new Set(part.AlienPartGroup.map((group) => group.userId)),
        ];

        let needsUpdate = false;
        const newAvailability = [...existingAvailability];

        // Ensure each user has an availability entry
        for (const userId of userIds) {
          if (!existingAvailability.some((a) => a.userId === userId)) {
            needsUpdate = true;
            newAvailability.push({
              userId,
              available: 1.0,
            });
          }
        }

        // Only update if we added new availability entries
        if (needsUpdate) {
          await prisma.alienPart.update({
            where: { id: part.id },
            data: {
              availability: newAvailability,
            },
          });
          console.log(
            `Updated availability for part ${
              part.id
            } with users: ${userIds.join(', ')}`,
          );
        }
      }
    }

    console.log('Successfully updated alien parts availability');
  } catch (error) {
    console.error('Error in update_availability seed:', error);
    throw error;
  }
}
